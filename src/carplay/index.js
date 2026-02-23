/**
 * CarPlay UI Compliance — Phase 1 MVP
 *
 * Validates navigation routes against Apple Human Interface Guidelines (HIG)
 * for CarPlay.  CarPlay imposes strict limits on the number of displayed items,
 * the length of text labels, and the depth of interactive hierarchies to keep
 * the driver experience safe and uncluttered.
 *
 * References:
 *   - Apple CarPlay App Programming Guide
 *   - Apple Human Interface Guidelines — CarPlay
 */

/** Maximum number of waypoints a route may contain (origin + destination + intermediates). */
export const CARPLAY_MAX_WAYPOINTS = 25;

/** Maximum character length for a route name displayed on the CarPlay screen. */
export const CARPLAY_MAX_ROUTE_NAME_LENGTH = 50;

/** Maximum number of steps in a single route's instruction list. */
export const CARPLAY_MAX_STEPS = 24;

/**
 * Validates a navigation route for CarPlay display and interaction compliance.
 *
 * Checks performed:
 *   1. Route must have at least two waypoints (origin and destination).
 *   2. Total waypoint count must not exceed CARPLAY_MAX_WAYPOINTS.
 *   3. Route name (if present) must not exceed CARPLAY_MAX_ROUTE_NAME_LENGTH characters.
 *   4. Steps array (if present) must not exceed CARPLAY_MAX_STEPS entries.
 *
 * @param {{ waypoints: Array, name?: string, steps?: Array }} route - Route to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result with any error messages
 */
export function validateRouteForCarPlay(route) {
  const errors = [];

  if (!route || !Array.isArray(route.waypoints)) {
    errors.push('Route must contain a waypoints array');
    return { valid: false, errors };
  }

  if (route.waypoints.length < 2) {
    errors.push('Route must have at least two waypoints (origin and destination)');
  }

  if (route.waypoints.length > CARPLAY_MAX_WAYPOINTS) {
    errors.push(
      `Route exceeds the CarPlay maximum of ${CARPLAY_MAX_WAYPOINTS} waypoints ` +
        `(got ${route.waypoints.length})`,
    );
  }

  if (route.name !== undefined) {
    if (typeof route.name !== 'string') {
      errors.push('Route name must be a string');
    } else if (route.name.length > CARPLAY_MAX_ROUTE_NAME_LENGTH) {
      errors.push(
        `Route name exceeds the CarPlay maximum of ${CARPLAY_MAX_ROUTE_NAME_LENGTH} characters ` +
          `(got ${route.name.length})`,
      );
    }
  }

  if (route.steps !== undefined) {
    if (!Array.isArray(route.steps)) {
      errors.push('Route steps must be an array');
    } else if (route.steps.length > CARPLAY_MAX_STEPS) {
      errors.push(
        `Route steps exceed the CarPlay maximum of ${CARPLAY_MAX_STEPS} entries ` +
          `(got ${route.steps.length})`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
