/**
 * Loop Generator — UltraOmegaLoopGenerator Integration
 *
 * Modular closed-loop circuit generation primitives inspired by the
 * UltraOmegaLoopGenerator framework.  Provides reusable building blocks for
 * AI-driven automation pipelines that produce fictional street-circuit specs
 * compatible with the Hey Marley app (voice-guided lap narration, CarPlay).
 *
 * Integrates with the Navigation Core (haversine distance) and Hazard
 * Detection modules to enable future Phase 3 multi-agent orchestration.
 */

import { haversineDistanceKm } from '../navigation/index.js';

/** Kilometres per statute mile */
const KM_PER_MILE = 1.60934;

const VALID_TRACK_TYPES = ['Technical', 'Flow', 'Stop-Start', 'Mixed', 'Street-Car Focused'];
const VALID_SERIES = ['Formula One', 'MotoGP', 'Mixed'];
const VALID_DIRECTIONS = ['Clockwise', 'Counter-Clockwise'];

/**
 * Creates a loop specification from the given UltraOmegaLoopGenerator-style
 * parameters.  The returned spec is the canonical input format for all other
 * functions in this module.
 *
 * @param {object} params - Loop generation parameters
 * @param {string} params.city - Target city or region
 * @param {number} params.minLengthMiles - Minimum circuit length in miles
 * @param {number} params.maxLengthMiles - Maximum circuit length in miles
 * @param {'Technical'|'Flow'|'Stop-Start'|'Mixed'|'Street-Car Focused'} params.trackType
 *   Track character emphasis
 * @param {'Formula One'|'MotoGP'|'Mixed'} params.seriesFocus - Primary racing series
 * @param {'Clockwise'|'Counter-Clockwise'} params.direction - Direction of travel
 * @param {Array<{ lat: number, lng: number, streetName?: string }>} params.waypoints
 *   Ordered waypoints forming the loop (minimum 3)
 * @returns {{ city: string, minLengthMiles: number, maxLengthMiles: number,
 *             trackType: string, seriesFocus: string, direction: string,
 *             waypoints: Array, isClosed: boolean }}
 * @throws {Error} When required parameters are missing or invalid
 */
export function createLoopSpec(params) {
  if (!params || typeof params.city !== 'string' || !params.city.trim()) {
    throw new Error('city is required');
  }
  if (typeof params.minLengthMiles !== 'number' || typeof params.maxLengthMiles !== 'number') {
    throw new Error('minLengthMiles and maxLengthMiles must be numbers');
  }
  if (params.minLengthMiles >= params.maxLengthMiles) {
    throw new Error('minLengthMiles must be less than maxLengthMiles');
  }
  if (!VALID_TRACK_TYPES.includes(params.trackType)) {
    throw new Error(`trackType must be one of: ${VALID_TRACK_TYPES.join(', ')}`);
  }
  if (!VALID_SERIES.includes(params.seriesFocus)) {
    throw new Error(`seriesFocus must be one of: ${VALID_SERIES.join(', ')}`);
  }
  if (!VALID_DIRECTIONS.includes(params.direction)) {
    throw new Error(`direction must be one of: ${VALID_DIRECTIONS.join(', ')}`);
  }
  if (!Array.isArray(params.waypoints) || params.waypoints.length < 3) {
    throw new Error('waypoints must be an array of at least 3 points');
  }

  const first = params.waypoints[0];
  const last = params.waypoints[params.waypoints.length - 1];
  const isClosed = first.lat === last.lat && first.lng === last.lng;

  return {
    city: params.city.trim(),
    minLengthMiles: params.minLengthMiles,
    maxLengthMiles: params.maxLengthMiles,
    trackType: params.trackType,
    seriesFocus: params.seriesFocus,
    direction: params.direction,
    waypoints: params.waypoints,
    isClosed,
  };
}

/**
 * Validates that a loop specification forms a valid closed circuit.
 * Enforces the UltraOmegaLoopGenerator rules: the loop must be closed and
 * must not reuse the same street on consecutive waypoints.
 *
 * @param {{ waypoints: Array<{ lat: number, lng: number, streetName?: string }>,
 *           isClosed: boolean }} loop - Loop spec to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateLoop(loop) {
  const errors = [];

  if (!loop || !Array.isArray(loop.waypoints) || loop.waypoints.length < 3) {
    errors.push('loop must have at least 3 waypoints');
    return { valid: false, errors };
  }

  if (!loop.isClosed) {
    errors.push('loop must be closed (first and last waypoint must match)');
  }

  // No doubling back — consecutive named waypoints must use different streets
  const named = loop.waypoints.filter((wp) => typeof wp.streetName === 'string');
  for (let i = 0; i < named.length - 1; i++) {
    if (named[i].streetName === named[i + 1].streetName) {
      errors.push(`duplicate consecutive street: "${named[i].streetName}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Splits loop waypoints into numbered sectors for structured lap narration,
 * following the standard 3-sector format used in Formula One and MotoGP
 * broadcasts.  Adjacent sectors share a boundary waypoint so that narration
 * flows continuously between them.
 *
 * @param {{ waypoints: Array<{ lat: number, lng: number }> }} loop - Loop spec
 * @param {number} [numSectors=3] - Number of sectors (default 3)
 * @returns {Array<{ sector: number, waypoints: Array<{ lat: number, lng: number }> }>}
 * @throws {Error} When numSectors is less than 1 or exceeds the waypoint count
 */
export function generateSectorWaypoints(loop, numSectors = 3) {
  if (!loop || !Array.isArray(loop.waypoints)) {
    throw new Error('loop must have a waypoints array');
  }
  if (typeof numSectors !== 'number' || numSectors < 1) {
    throw new Error('numSectors must be a positive number');
  }
  const wps = loop.waypoints;
  if (numSectors > wps.length) {
    throw new Error('numSectors cannot exceed the number of waypoints');
  }

  const perSector = Math.floor(wps.length / numSectors);
  const sectors = [];
  for (let s = 0; s < numSectors; s++) {
    const start = s * perSector;
    // Last sector takes all remaining waypoints; others include one overlap point
    const end = s === numSectors - 1 ? wps.length : start + perSector + 1;
    sectors.push({ sector: s + 1, waypoints: wps.slice(start, end) });
  }
  return sectors;
}

/**
 * Checks whether the loop's total Haversine distance (in miles) falls within
 * the target range defined in the loop parameters.
 *
 * @param {{ minLengthMiles: number, maxLengthMiles: number,
 *           waypoints: Array<{ lat: number, lng: number }> }} loop - Loop spec
 * @returns {boolean} True when the loop distance is within the specified range
 */
export function isWithinTargetLength(loop) {
  if (!loop || !Array.isArray(loop.waypoints) || loop.waypoints.length < 2) {
    return false;
  }
  let totalKm = 0;
  for (let i = 0; i < loop.waypoints.length - 1; i++) {
    totalKm += haversineDistanceKm(loop.waypoints[i], loop.waypoints[i + 1]);
  }
  const totalMiles = totalKm / KM_PER_MILE;
  return totalMiles >= loop.minLengthMiles && totalMiles <= loop.maxLengthMiles;
}
