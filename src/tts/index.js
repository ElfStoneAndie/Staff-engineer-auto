/**
 * TTS Engine — Phase 1 MVP
 *
 * Provides voice-guided navigation prompt generation for the Staff Engineer
 * Auto navigation loop.  Prompts are plain-text strings ready to be spoken by
 * any downstream TTS engine (e.g. AVSpeechSynthesizer on iOS / CarPlay).
 */

/** @type {Record<string, string>} Maps direction keys to human-readable action phrases. */
const DIRECTION_LABELS = {
  left: 'turn left',
  right: 'turn right',
  straight: 'continue straight ahead',
  'u-turn': 'make a U-turn',
};

/**
 * Formats a distance in metres into a human-readable string.
 *
 * @param {number} metres - Distance in metres (non-negative)
 * @returns {string} Human-readable distance string
 * @throws {Error} When metres is not a non-negative number
 */
export function formatDistance(metres) {
  if (typeof metres !== 'number' || metres < 0) {
    throw new Error('Distance must be a non-negative number');
  }
  if (metres >= 1000) {
    const km = (metres / 1000).toFixed(1);
    return `${km} kilometres`;
  }
  return `${Math.round(metres)} metres`;
}

/**
 * Generates a turn navigation prompt.
 *
 * @param {'left'|'right'|'straight'|'u-turn'} direction - Turn direction
 * @param {number} distanceMetres - Distance in metres until the turn
 * @returns {string} Voice prompt string
 * @throws {Error} When direction is unrecognised or distance is invalid
 */
export function generateTurnPrompt(direction, distanceMetres) {
  const label = DIRECTION_LABELS[direction];
  if (!label) {
    throw new Error(`Unrecognised direction: ${direction}`);
  }
  const dist = formatDistance(distanceMetres);
  return `In ${dist}, ${label}.`;
}

/**
 * Generates an arrival prompt when the user reaches their destination.
 *
 * @param {string} [destination] - Optional destination name
 * @returns {string} Voice prompt string
 */
export function generateArrivalPrompt(destination) {
  if (destination && typeof destination === 'string' && destination.trim().length > 0) {
    return `You have arrived at ${destination.trim()}.`;
  }
  return 'You have arrived at your destination.';
}

/**
 * Generates a route recalculation prompt.
 *
 * @returns {string} Voice prompt string
 */
export function generateRecalculatingPrompt() {
  return 'Recalculating route. Please follow the new directions.';
}

/**
 * Generates a speed warning prompt.
 *
 * @param {number} speedLimit - Speed limit in km/h
 * @returns {string} Voice prompt string
 * @throws {Error} When speedLimit is not a positive number
 */
export function generateSpeedWarningPrompt(speedLimit) {
  if (typeof speedLimit !== 'number' || speedLimit <= 0) {
    throw new Error('Speed limit must be a positive number');
  }
  return `Speed limit is ${speedLimit} kilometres per hour.`;
}
