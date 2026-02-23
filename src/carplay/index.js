/**
 * CarPlay UI Compliance — Phase 1 MVP
 *
 * Utilities for building Apple CarPlay-compliant user interfaces and
 * validating navigation flows against Apple's Human Interface Guidelines.
 */

/** Maximum number of list items recommended by Apple CarPlay guidelines. */
const CARPLAY_MAX_LIST_ITEMS = 12;

/** Maximum number of interaction steps allowed for a driving task per Apple guidelines. */
const CARPLAY_MAX_INTERACTION_STEPS = 3;

/**
 * Validates whether a route object meets CarPlay display requirements.
 *
 * @param {{ waypoints: Array, type: string }} route - Route object
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validateRouteForCarPlay(route) {
  const errors = [];
  if (!route || typeof route !== 'object') {
    errors.push('Route must be an object');
    return { valid: false, errors };
  }
  if (!Array.isArray(route.waypoints) || route.waypoints.length === 0) {
    errors.push('Route must have at least one waypoint');
  }
  if (!route.type || typeof route.type !== 'string') {
    errors.push('Route must have a type string');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Builds a CarPlay-compliant screen descriptor from a navigation route.
 *
 * @param {{ waypoints: Array<{ lat: number, lng: number }>, type: string }} route - Route object
 * @param {string} [title='Navigation'] - Screen title
 * @returns {{ title: string, items: Array<{ label: string }>, interactive: boolean }}
 * @throws {Error} When the route fails CarPlay validation
 */
export function buildCarPlayScreen(route, title = 'Navigation') {
  const validation = validateRouteForCarPlay(route);
  if (!validation.valid) {
    throw new Error(`Invalid route for CarPlay: ${validation.errors.join('; ')}`);
  }

  const items = route.waypoints.slice(0, CARPLAY_MAX_LIST_ITEMS).map((wp, index) => ({
    label: `Waypoint ${index + 1}: lat ${wp.lat.toFixed(4)}, lng ${wp.lng.toFixed(4)}`,
  }));

  return {
    title,
    items,
    interactive: false, // Minimise interaction while driving
  };
}

/**
 * Validates a user flow against Apple CarPlay interaction guidelines.
 * A flow is an ordered array of step names representing user interactions.
 *
 * @param {string[]} steps - Ordered array of user interaction step names
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validateUserFlow(steps) {
  const errors = [];
  if (!Array.isArray(steps)) {
    errors.push('Steps must be an array');
    return { valid: false, errors };
  }
  if (steps.length > CARPLAY_MAX_INTERACTION_STEPS) {
    errors.push(
      `User flow exceeds the maximum of ${CARPLAY_MAX_INTERACTION_STEPS} interaction steps`,
    );
  }
  if (steps.some((s) => typeof s !== 'string' || s.trim().length === 0)) {
    errors.push('Each step must be a non-empty string');
  }
  return { valid: errors.length === 0, errors };
}
