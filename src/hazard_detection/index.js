/**
 * Hazard Detection — Phase 2 Premium
 *
 * AI-driven hazard detection utilities.  Identifies whether a GPS location
 * falls within a known hazard zone and calculates proximity to hazards.
 */

import { haversineDistanceKm } from '../navigation/index.js';

/**
 * Checks whether a coordinate is inside a circular hazard zone.
 *
 * @param {{ lat: number, lng: number }} location - Current GPS coordinate
 * @param {{ centre: { lat: number, lng: number }, radiusKm: number, type: string }} zone
 *   Hazard zone descriptor
 * @returns {boolean} True when the location is within the zone radius
 */
export function isInHazardZone(location, zone) {
  if (!location || !zone || !zone.centre || typeof zone.radiusKm !== 'number') {
    return false;
  }
  const distKm = haversineDistanceKm(location, zone.centre);
  return distKm <= zone.radiusKm;
}

/**
 * Returns all hazard zones that contain the given location.
 *
 * @param {{ lat: number, lng: number }} location - Current GPS coordinate
 * @param {Array<{ centre: { lat: number, lng: number }, radiusKm: number, type: string }>} [zones]
 *   Array of hazard zone descriptors
 * @returns {Array<{ centre: object, radiusKm: number, type: string }>} Active hazard zones
 */
export function detectHazards(location, zones = []) {
  if (!Array.isArray(zones)) {
    return [];
  }
  return zones.filter((zone) => isInHazardZone(location, zone));
}

/**
 * Returns the nearest hazard zone and its distance from the given location.
 *
 * @param {{ lat: number, lng: number }} location - Current GPS coordinate
 * @param {Array<{ centre: { lat: number, lng: number }, radiusKm: number, type: string }>} [zones]
 *   Array of hazard zone descriptors
 * @returns {{ zone: object, distanceKm: number } | null} Nearest zone with distance, or null
 */
export function nearestHazard(location, zones = []) {
  if (!Array.isArray(zones) || zones.length === 0) {
    return null;
  }
  let nearest = null;
  let minDist = Infinity;
  for (const zone of zones) {
    if (!zone || !zone.centre) continue;
    const dist = haversineDistanceKm(location, zone.centre);
    if (dist < minDist) {
      minDist = dist;
      nearest = zone;
    }
  }
  return nearest ? { zone: nearest, distanceKm: minDist } : null;
}
