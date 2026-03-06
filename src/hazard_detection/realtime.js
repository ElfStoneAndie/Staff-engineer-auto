/**
 * Real-Time Hazard Zone Mapping — Phase 2 Premium
 *
 * Extends the static hazard detection module with live data ingestion.
 * Fetches hazard zones from a remote API and supports subscription-based
 * callbacks when hazard data changes near a given location.
 */

/**
 * Fetches live hazard zones within a geographic bounding box.
 *
 * @param {string} apiKey - API key for the hazard data provider
 * @param {{ north: number, south: number, east: number, west: number }} bounds
 *   Geographic bounding box to query
 * @returns {Promise<Array<{ centre: { lat: number, lng: number }, radiusKm: number, type: string }>>}
 *   Array of live hazard zone descriptors
 * @throws {Error} When apiKey is missing or bounds are invalid
 */
export async function fetchLiveHazardZones(apiKey, bounds) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('A valid API key is required');
  }
  if (
    !bounds ||
    typeof bounds.north !== 'number' ||
    typeof bounds.south !== 'number' ||
    typeof bounds.east !== 'number' ||
    typeof bounds.west !== 'number'
  ) {
    throw new Error('Bounds must include numeric north, south, east and west values');
  }
  // TODO: replace with real HTTP request to hazard data provider
  throw new Error('fetchLiveHazardZones is not yet implemented');
}

/**
 * Subscribes to real-time hazard updates for a given location.
 * Invokes the callback whenever the active hazard set changes.
 *
 * @param {{ lat: number, lng: number }} location - Current GPS coordinate to monitor
 * @param {Function} callback - Called with `(zones: Array)` on each update
 * @returns {{ unsubscribe: Function }} Subscription handle; call `.unsubscribe()` to stop
 * @throws {Error} When location is invalid or callback is not a function
 */
export function subscribeToHazardUpdates(location, callback) {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error('A valid location coordinate is required');
  }
  if (typeof callback !== 'function') {
    throw new Error('A callback function is required');
  }
  // TODO: establish WebSocket / SSE connection and invoke callback on data events
  throw new Error('subscribeToHazardUpdates is not yet implemented');
}
