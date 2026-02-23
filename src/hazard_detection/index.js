/**
 * Hazard Detection — Phase 2 feature, scaffolded in Phase 1
 *
 * Provides proximity-based hazard zone detection.  A hazard zone is modelled
 * as a circle defined by a centre coordinate and a radius in kilometres.
 * Distance calculations reuse the Haversine formula from the navigation
 * module to avoid duplication.
 */

import { haversineDistanceKm } from '../navigation/index.js';

/**
 * Determines whether a GPS location falls within a circular hazard zone.
 *
 * @param {{ lat: number, lng: number }} location - Current GPS position
 * @param {{ centre: { lat: number, lng: number }, radiusKm: number, name: string }} zone
 *   Hazard zone descriptor
 * @returns {boolean} True when the location is within the zone's radius
 */
export function isInHazardZone(location, zone) {
  const distanceKm = haversineDistanceKm(location, zone.centre);
  return distanceKm <= zone.radiusKm;
}

/**
 * Returns all hazard zones that contain the given location.
 *
 * @param {{ lat: number, lng: number }} location - Current GPS position
 * @param {Array<{ centre: { lat: number, lng: number }, radiusKm: number, name: string }>} zones
 *   Array of hazard zone descriptors
 * @returns {Array<{ centre: object, radiusKm: number, name: string }>} Active zones for the location
 */
export function detectHazards(location, zones) {
  return zones.filter((zone) => isInHazardZone(location, zone));
}

/**
 * Returns the nearest hazard zone to the given location along with its
 * distance, or `null` when the zones array is empty.
 *
 * @param {{ lat: number, lng: number }} location - Current GPS position
 * @param {Array<{ centre: { lat: number, lng: number }, radiusKm: number, name: string }>} zones
 *   Array of hazard zone descriptors
 * @returns {{ zone: object, distanceKm: number } | null} Nearest zone and distance, or null
 */
export function nearestHazard(location, zones) {
  if (!zones || zones.length === 0) {
    return null;
  }
  let nearest = null;
  let minDistance = Infinity;
  for (const zone of zones) {
    const distanceKm = haversineDistanceKm(location, zone.centre);
    if (distanceKm < minDistance) {
      minDistance = distanceKm;
      nearest = zone;
    }
  }
  return { zone: nearest, distanceKm: minDistance };
}
