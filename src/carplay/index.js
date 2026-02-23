/**
 * CarPlay UI Compliance — Phase 1 MVP
 *
 * Helpers that validate navigation data structures against Apple's Human
 * Interface Guidelines for CarPlay.  All functions are pure and
 * side-effect-free.
 *
 * Key constraints enforced:
 *  - Route display lists are capped at 12 items (Apple HIG §CarPlay).
 *  - Driving task flows must complete within 3 user interactions.
 *  - Screens are marked non-interactive (driver-distraction prevention).
 */

/** Maximum number of items that may appear on a single CarPlay screen. */
const MAX_SCREEN_ITEMS = 12;

/** Maximum number of steps allowed in a CarPlay driving user flow. */
const MAX_FLOW_STEPS = 3;

/**
 * Validates a route object for CarPlay display requirements.
 *
 * A valid route must have:
 *  - An `origin` coordinate object
 *  - A `destination` coordinate object
 *  - A `waypoints` array with at least 2 entries and no more than
 *    MAX_SCREEN_ITEMS entries (so all stops fit on a single screen)
 *
 * @param {{ origin: object, destination: object, waypoints: Array }} route
 * @returns {{ valid: boolean, errors: string[] }} Validation result with a list of errors
 */
export function validateRouteForCarPlay(route) {
  const errors = [];
  if (!route || typeof route !== 'object') {
    errors.push('route must be an object');
    return { valid: false, errors };
  }
  if (!route.origin) {
    errors.push('route.origin is required');
  }
  if (!route.destination) {
    errors.push('route.destination is required');
  }
  if (!Array.isArray(route.waypoints)) {
    errors.push('route.waypoints must be an array');
  } else {
    if (route.waypoints.length < 2) {
      errors.push('route.waypoints must contain at least 2 entries');
    }
    if (route.waypoints.length > MAX_SCREEN_ITEMS) {
      errors.push(
        `route.waypoints must not exceed ${MAX_SCREEN_ITEMS} entries (CarPlay screen limit)`,
      );
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Builds a CarPlay screen descriptor from a route and optional title.
 *
 * The resulting descriptor is suitable for rendering a turn-list view on a
 * CarPlay display.  The `items` array is capped at MAX_SCREEN_ITEMS to
 * prevent driver distraction.
 *
 * @param {{ origin: object, destination: object, waypoints: Array }} route - Route object
 * @param {string} [title='Navigation'] - Screen title shown in the CarPlay header
 * @returns {{ title: string, items: Array, interactive: boolean }} CarPlay screen descriptor
 */
export function buildCarPlayScreen(route, title = 'Navigation') {
  const waypoints = Array.isArray(route && route.waypoints) ? route.waypoints : [];
  const items = waypoints.slice(0, MAX_SCREEN_ITEMS).map((wp, index) => ({
    index,
    coordinate: wp,
  }));
  return {
    title: String(title),
    items,
    interactive: false,
  };
}

/**
 * Validates a user-flow step list for CarPlay driving compliance.
 *
 * Apple's HIG requires that tasks initiated while driving be completable in
 * no more than MAX_FLOW_STEPS interactions.
 *
 * @param {Array<string>} steps - Ordered list of interaction step labels
 * @returns {{ valid: boolean, errors: string[] }} Validation result with a list of errors
 */
export function validateUserFlow(steps) {
  const errors = [];
  if (!Array.isArray(steps)) {
    errors.push('steps must be an array');
    return { valid: false, errors };
  }
  if (steps.length === 0) {
    errors.push('steps must contain at least one entry');
  }
  if (steps.length > MAX_FLOW_STEPS) {
    errors.push(
      `user flow must not exceed ${MAX_FLOW_STEPS} steps (Apple HIG CarPlay requirement)`,
    );
  }
  return { valid: errors.length === 0, errors };
}
