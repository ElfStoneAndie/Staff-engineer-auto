/**
 * Hazard Detection — Phase 1 MVP
 *
 * Provides proximity-based hazard detection for the navigation loop.
 * Given the driver's current GPS position and a list of known hazards
 * (e.g. road works, accidents, speed cameras), this module returns the
 * hazards that fall within a configurable alert radius.
 *
 * Distance calculations reuse the Haversine formula so results are
 * consistent with the Navigation Core module.
 */

import { haversineDistanceKm } from '../navigation/index.js';

/** Default alert radius in metres used when no radius is specified. */
export const DEFAULT_ALERT_RADIUS_METERS = 500;

/**
 * Supported hazard types.
 * @readonly
 * @enum {string}
 */
export const HAZARD_TYPES = Object.freeze({
  ROAD_WORKS: 'road_works',
  ACCIDENT: 'accident',
  SPEED_CAMERA: 'speed_camera',
  ROAD_CLOSURE: 'road_closure',
  DEBRIS: 'debris',
});

/**
 * Detects hazards within a given radius of the current position.
 *
 * @param {{ lat: number, lng: number }} position - Current GPS position
 * @param {Array<{ id: string, type: string, position: { lat: number, lng: number }, description?: string }>} hazards - Known hazards to check
 * @param {number} [radiusMeters=DEFAULT_ALERT_RADIUS_METERS] - Alert radius in metres (> 0)
 * @returns {Array<{ id: string, type: string, position: object, distanceMeters: number, description?: string }>}
 *   Hazards within the radius, sorted nearest-first, each annotated with distanceMeters
 * @throws {Error} When position is not a valid coordinate object
 * @throws {Error} When radiusMeters is not a positive number
 */
export function detectNearbyHazards(position, hazards, radiusMeters = DEFAULT_ALERT_RADIUS_METERS) {
  if (
    !position ||
    typeof position.lat !== 'number' ||
    typeof position.lng !== 'number'
  ) {
    throw new Error('position must be an object with numeric lat and lng properties');
  }
  if (typeof radiusMeters !== 'number' || radiusMeters <= 0) {
    throw new Error('radiusMeters must be a positive number');
  }
  if (!Array.isArray(hazards)) {
    throw new Error('hazards must be an array');
  }

  const radiusKm = radiusMeters / 1000;

  const nearby = [];
  for (const hazard of hazards) {
    if (
      !hazard ||
      !hazard.position ||
      typeof hazard.position.lat !== 'number' ||
      typeof hazard.position.lng !== 'number'
    ) {
      continue; // skip malformed hazard entries
    }

    const distanceKm = haversineDistanceKm(position, hazard.position);
    if (distanceKm <= radiusKm) {
      const entry = { ...hazard, distanceMeters: Math.round(distanceKm * 1000) };
      nearby.push(entry);
    }
  }

  nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return nearby;
}

/**
 * Returns the highest-severity hazard from a list of detected nearby hazards,
 * or null when the list is empty.
 *
 * Severity order (highest first):
 *   road_closure > accident > road_works > debris > speed_camera
 *
 * @param {Array<{ type: string }>} nearbyHazards - Hazards returned by detectNearbyHazards
 * @returns {{ type: string } | null} The most severe hazard or null
 */
export function getMostSevereHazard(nearbyHazards) {
  if (!Array.isArray(nearbyHazards) || nearbyHazards.length === 0) {
    return null;
  }

  const severityRank = {
    [HAZARD_TYPES.ROAD_CLOSURE]: 5,
    [HAZARD_TYPES.ACCIDENT]: 4,
    [HAZARD_TYPES.ROAD_WORKS]: 3,
    [HAZARD_TYPES.DEBRIS]: 2,
    [HAZARD_TYPES.SPEED_CAMERA]: 1,
  };

  return nearbyHazards.reduce((worst, current) => {
    const worstRank = severityRank[worst.type] ?? 0;
    const currentRank = severityRank[current.type] ?? 0;
    return currentRank > worstRank ? current : worst;
  });
}
