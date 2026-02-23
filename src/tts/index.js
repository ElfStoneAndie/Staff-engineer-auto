/**
 * TTS (Text-to-Speech) Voice Guidance — Phase 1 MVP
 *
 * Generates plain-text navigation prompts ready for any downstream TTS engine
 * (e.g. AVSpeechSynthesizer for Apple platforms).  All functions are pure and
 * side-effect-free; no audio hardware is accessed directly.
 */

/**
 * Formats a distance value into a human-readable string using metric units.
 * Values below 1000 m are expressed in metres; values >= 1000 m are
 * expressed in kilometres with up to one decimal place.
 *
 * @param {number} metres - Distance in metres (must be >= 0)
 * @returns {string} Formatted distance string, e.g. "200 metres" or "1.5 kilometres"
 */
export function formatDistance(metres) {
  if (metres < 1000) {
    return `${metres} metres`;
  }
  const km = metres / 1000;
  const rounded = Math.round(km * 10) / 10;
  return `${rounded} kilometre${rounded === 1 ? '' : 's'}`;
}

/**
 * Generates a turn instruction prompt.
 *
 * @param {string} direction - Turn direction, e.g. "left", "right", "u-turn", "straight"
 * @param {number} distanceMetres - Distance to the turn in metres
 * @returns {string} Voice prompt, e.g. "In 200 metres, turn left."
 * @throws {Error} When direction is not a non-empty string or distance is negative
 */
export function generateTurnPrompt(direction, distanceMetres) {
  if (typeof direction !== 'string' || direction.trim() === '') {
    throw new Error('direction must be a non-empty string');
  }
  if (typeof distanceMetres !== 'number' || distanceMetres < 0) {
    throw new Error('distanceMetres must be a non-negative number');
  }
  const dist = formatDistance(distanceMetres);
  const dir = direction.trim().toLowerCase();
  if (dir === 'u-turn') {
    return `In ${dist}, make a U-turn.`;
  }
  return `In ${dist}, turn ${dir}.`;
}

/**
 * Generates an arrival prompt for a named destination.
 *
 * @param {string} destinationName - Name of the destination
 * @returns {string} Voice prompt, e.g. "You have arrived at Golden Gate."
 * @throws {Error} When destinationName is not a non-empty string
 */
export function generateArrivalPrompt(destinationName) {
  if (typeof destinationName !== 'string' || destinationName.trim() === '') {
    throw new Error('destinationName must be a non-empty string');
  }
  return `You have arrived at ${destinationName.trim()}.`;
}

/**
 * Generates a route-recalculation prompt.
 *
 * @returns {string} Standard recalculating voice prompt
 */
export function generateRecalculatingPrompt() {
  return 'Recalculating route. Please follow the new directions.';
}

/**
 * Generates a speed-limit warning prompt.
 *
 * @param {number} limitKph - Speed limit in kilometres per hour (must be > 0)
 * @returns {string} Voice prompt, e.g. "Speed limit is 60 kilometres per hour."
 * @throws {Error} When limitKph is not a positive number
 */
export function generateSpeedWarningPrompt(limitKph) {
  if (typeof limitKph !== 'number' || limitKph <= 0) {
    throw new Error('limitKph must be a positive number');
  }
  return `Speed limit is ${limitKph} kilometres per hour.`;
}
