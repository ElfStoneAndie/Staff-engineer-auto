/**
 * Hazard Detection — Phase 2
 *
 * AI-driven hazard detection module for the Staff Engineer Auto navigation
 * system.  Identifies hazards along a route (speed cameras, flock cameras,
 * dips, speed bumps, railroad crossings, construction zones, and road
 * closures) and generates voice warnings suitable for TTS delivery.
 */

import { haversineDistanceKm } from '../navigation/index.js';

/**
 * Enumeration of supported hazard types.
 *
 * @readonly
 * @enum {string}
 */
export const HAZARD_TYPES = Object.freeze({
  SPEED_CAMERA: 'speed_camera',
  FLOCK_CAMERA: 'flock_camera',
  DIP: 'dip',
  SPEED_BUMP: 'speed_bump',
  RAILROAD_CROSSING: 'railroad_crossing',
  CONSTRUCTION: 'construction',
  CLOSURE: 'closure',
});

/**
 * Validates that a hazard object has all required fields and a recognised type.
 *
 * @param {object} hazard - Hazard to validate
 * @param {string} hazard.type - Hazard type (must be one of {@link HAZARD_TYPES})
 * @param {number} hazard.lat - Latitude of the hazard location
 * @param {number} hazard.lng - Longitude of the hazard location
 * @returns {boolean} True when the hazard is valid
 */
export function isValidHazard(hazard) {
  if (!hazard || typeof hazard.type !== 'string') return false;
  if (!Object.values(HAZARD_TYPES).includes(hazard.type)) return false;
  if (typeof hazard.lat !== 'number' || typeof hazard.lng !== 'number') return false;
  return hazard.lat >= -90 && hazard.lat <= 90 && hazard.lng >= -180 && hazard.lng <= 180;
}

/**
 * Returns hazards that fall within the specified radius of a coordinate.
 *
 * @param {Array<object>} hazards - Array of hazard objects to search
 * @param {{ lat: number, lng: number }} coord - Centre coordinate
 * @param {number} [radiusKm=0.5] - Search radius in kilometres
 * @returns {Array<object>} Hazards within the radius, preserving original order
 */
export function getHazardsNearCoordinate(hazards, coord, radiusKm = 0.5) {
  return hazards.filter(
    (h) => isValidHazard(h) && haversineDistanceKm(coord, h) <= radiusKm,
  );
}

/**
 * Returns the unique set of hazards that fall within the specified radius of
 * any waypoint in the given route.  Each hazard is included at most once even
 * if it is near multiple waypoints.
 *
 * @param {Array<object>} hazards - Array of hazard objects to search
 * @param {{ waypoints: Array<{ lat: number, lng: number }> }} route - Route object
 * @param {number} [radiusKm=0.5] - Search radius in kilometres
 * @returns {Array<object>} Unique hazards along the route in encounter order
 */
export function getHazardsAlongRoute(hazards, route, radiusKm = 0.5) {
  const seen = new Set();
  const result = [];
  for (const waypoint of route.waypoints) {
    for (const hazard of getHazardsNearCoordinate(hazards, waypoint, radiusKm)) {
      const key = `${hazard.type}:${hazard.lat}:${hazard.lng}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(hazard);
      }
    }
  }
  return result;
}

/**
 * Generates a voice warning string for the given hazard, suitable for TTS
 * delivery to the driver.
 *
 * @param {object} hazard - Hazard object
 * @param {string} hazard.type - Hazard type (must be one of {@link HAZARD_TYPES})
 * @returns {string} Voice warning message
 * @throws {Error} When the hazard type is not recognised
 */
export function generateVoiceWarning(hazard) {
  const warnings = {
    [HAZARD_TYPES.SPEED_CAMERA]: 'Warning: Speed camera ahead.',
    [HAZARD_TYPES.FLOCK_CAMERA]: 'Warning: Flock camera ahead.',
    [HAZARD_TYPES.DIP]: 'Caution: Dip in the road ahead.',
    [HAZARD_TYPES.SPEED_BUMP]: 'Caution: Speed bump ahead.',
    [HAZARD_TYPES.RAILROAD_CROSSING]: 'Warning: Railroad crossing ahead.',
    [HAZARD_TYPES.CONSTRUCTION]: 'Warning: Construction zone ahead.',
    [HAZARD_TYPES.CLOSURE]: 'Warning: Road closure ahead.',
  };
  const message = warnings[hazard.type];
  if (!message) {
    throw new Error(`Unrecognised hazard type: ${hazard.type}`);
  }
  return message;
}
