/**
 * Navigation Core — Phase 1 MVP
 *
 * Provides route generation, randomised route-path selection, and basic
 * GPS-coordinate compliance validation for the Staff Engineer Auto navigation
 * loop (free tier).
 */

/**
 * Validates that a GPS coordinate object has numeric latitude and longitude
 * within legal ranges.
 *
 * @param {{ lat: number, lng: number }} coord - Coordinate to validate
 * @returns {boolean} True when the coordinate is valid
 */
export function isValidCoordinate(coord) {
  if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
    return false;
  }
  return coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180;
}

/**
 * Generates a direct route between two waypoints.
 *
 * @param {{ lat: number, lng: number }} origin - Starting coordinate
 * @param {{ lat: number, lng: number }} destination - Ending coordinate
 * @returns {{ origin: object, destination: object, waypoints: Array, type: string }}
 * @throws {Error} When either coordinate is invalid
 */
export function generateRoute(origin, destination) {
  if (!isValidCoordinate(origin)) {
    throw new Error('Invalid origin coordinate');
  }
  if (!isValidCoordinate(destination)) {
    throw new Error('Invalid destination coordinate');
  }
  return {
    origin,
    destination,
    waypoints: [origin, destination],
    type: 'direct',
  };
}

/**
 * Generates a route with one randomly-chosen intermediate waypoint from the
 * provided pool.  Falls back to a direct route when the pool is empty.
 *
 * @param {{ lat: number, lng: number }} origin - Starting coordinate
 * @param {{ lat: number, lng: number }} destination - Ending coordinate
 * @param {Array<{ lat: number, lng: number }>} waypointPool - Candidate intermediate points
 * @returns {{ origin: object, destination: object, waypoints: Array, type: string }}
 */
export function generateRandomisedRoute(origin, destination, waypointPool = []) {
  if (!isValidCoordinate(origin)) {
    throw new Error('Invalid origin coordinate');
  }
  if (!isValidCoordinate(destination)) {
    throw new Error('Invalid destination coordinate');
  }

  const validPool = waypointPool.filter(isValidCoordinate);

  if (validPool.length === 0) {
    return { origin, destination, waypoints: [origin, destination], type: 'direct' };
  }

  const intermediate = validPool[Math.floor(Math.random() * validPool.length)];
  return {
    origin,
    destination,
    waypoints: [origin, intermediate, destination],
    type: 'randomised',
  };
}

/**
 * Calculates the approximate distance in kilometres between two GPS coordinates
 * using the Haversine formula.
 *
 * @param {{ lat: number, lng: number }} a - First coordinate
 * @param {{ lat: number, lng: number }} b - Second coordinate
 * @returns {number} Distance in kilometres
 */
export function haversineDistanceKm(a, b) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const chord =
    sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

/**
 * Returns the total distance of a route in kilometres by summing the distances
 * between consecutive waypoints.
 *
 * @param {{ waypoints: Array<{ lat: number, lng: number }> }} route - Route object
 * @returns {number} Total distance in kilometres
 */
export function routeDistanceKm(route) {
  const { waypoints } = route;
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += haversineDistanceKm(waypoints[i], waypoints[i + 1]);
  }
  return total;
}
