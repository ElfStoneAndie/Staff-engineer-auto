/**
 * Navigation Core — Phase 1 (MVP)
 *
 * Provides route generation, randomized path selection, and GPS-compliance
 * helpers for the Staff Engineer Auto navigation loop.
 */

/**
 * Validates that a coordinate object has numeric lat/lng values within the
 * standard GPS ranges (-90 ≤ lat ≤ 90, -180 ≤ lng ≤ 180).
 *
 * @param {{ lat: number, lng: number }} coord - Coordinate to validate
 * @returns {boolean} True when the coordinate is GPS-compliant
 */
export function isValidCoordinate(coord) {
  if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
    return false;
  }
  return coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180;
}

/**
 * Generates a straight-line route between an origin and destination.
 * Intermediate waypoints are evenly distributed along the great-circle path.
 *
 * @param {{ lat: number, lng: number }} origin      - Starting coordinate
 * @param {{ lat: number, lng: number }} destination - Ending coordinate
 * @param {number} [steps=5]                         - Number of intermediate steps
 * @returns {{ waypoints: Array<{ lat: number, lng: number }>, distance: number }}
 *   Route object containing ordered waypoints (including origin and destination)
 *   and the estimated straight-line distance in kilometres.
 * @throws {Error} When either coordinate is invalid
 */
export function generateRoute(origin, destination, steps = 5) {
  if (!isValidCoordinate(origin)) {
    throw new Error('Invalid origin coordinate');
  }
  if (!isValidCoordinate(destination)) {
    throw new Error('Invalid destination coordinate');
  }

  const waypoints = [];
  const total = steps + 1; // intervals between origin and destination

  for (let i = 0; i <= total; i++) {
    const fraction = i / total;
    waypoints.push({
      lat: origin.lat + (destination.lat - origin.lat) * fraction,
      lng: origin.lng + (destination.lng - origin.lng) * fraction,
    });
  }

  const distance = haversineDistance(origin, destination);
  return { waypoints, distance };
}

/**
 * Randomises the order of an array of waypoints while always preserving the
 * first (origin) and last (destination) entries.
 *
 * @param {Array<{ lat: number, lng: number }>} waypoints - Ordered waypoint list
 * @returns {Array<{ lat: number, lng: number }>} New array with middle points shuffled
 */
export function randomizeRoute(waypoints) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return waypoints.slice();
  }

  const first = waypoints[0];
  const last = waypoints[waypoints.length - 1];
  const middle = waypoints.slice(1, -1);

  // Fisher-Yates shuffle on the intermediate waypoints
  for (let i = middle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [middle[i], middle[j]] = [middle[j], middle[i]];
  }

  return [first, ...middle, last];
}

/**
 * Computes the Haversine distance (in kilometres) between two GPS coordinates.
 *
 * @param {{ lat: number, lng: number }} a - First coordinate
 * @param {{ lat: number, lng: number }} b - Second coordinate
 * @returns {number} Distance in kilometres
 */
export function haversineDistance(a, b) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Generates a simple TTS voice-guidance prompt for a given navigation step.
 *
 * @param {{ lat: number, lng: number }} from - Current position
 * @param {{ lat: number, lng: number }} to   - Next waypoint
 * @param {number} stepIndex                  - 1-based step number
 * @returns {string} Human-readable navigation instruction
 */
export function generateVoicePrompt(from, to, stepIndex) {
  const distance = haversineDistance(from, to);
  const distanceText =
    distance < 1
      ? `${Math.round(distance * 1000)} metres`
      : `${distance.toFixed(1)} kilometres`;

  const latDir = to.lat >= from.lat ? 'north' : 'south';
  const lngDir = to.lng >= from.lng ? 'east' : 'west';

  return `Step ${stepIndex}: Head ${latDir}-${lngDir} for approximately ${distanceText}.`;
}
