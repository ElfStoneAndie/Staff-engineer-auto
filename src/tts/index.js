/**
 * TTS (Text-to-Speech) Voice Guidance — Phase 1 MVP
 *
 * Generates human-readable voice prompts for turn-by-turn navigation and
 * speed warnings.  These strings are designed to be passed directly to a
 * platform TTS engine (e.g. AVSpeechSynthesizer on iOS/CarPlay).
 */

/**
 * Supported turn directions.
 * @readonly
 * @enum {string}
 */
export const TURN_DIRECTIONS = Object.freeze({
  LEFT: 'left',
  RIGHT: 'right',
  STRAIGHT: 'straight',
  U_TURN: 'u-turn',
});

/**
 * Formats a distance in metres into a natural-language string.
 *
 * @param {number} distanceMeters - Distance in metres (non-negative number)
 * @returns {string} Human-readable distance string
 */
function formatDistance(distanceMeters) {
  if (distanceMeters < 1000) {
    return `in ${Math.round(distanceMeters)} metres`;
  }
  const km = (distanceMeters / 1000).toFixed(1);
  return `in ${km} kilometres`;
}

/**
 * Generates a voice prompt for an upcoming turn manoeuvre.
 *
 * @param {string} direction - Turn direction; one of the TURN_DIRECTIONS values
 * @param {string} streetName - Name of the street to turn onto
 * @param {number} distanceMeters - Distance to the manoeuvre in metres (>= 0)
 * @returns {string} TTS-ready prompt string
 * @throws {Error} When direction is not a recognised value
 * @throws {Error} When streetName is empty or not a string
 * @throws {Error} When distanceMeters is negative or not a number
 */
export function generateTurnPrompt(direction, streetName, distanceMeters) {
  const validDirections = Object.values(TURN_DIRECTIONS);
  if (!validDirections.includes(direction)) {
    throw new Error(
      `Invalid direction: "${direction}". Must be one of: ${validDirections.join(', ')}`,
    );
  }
  if (typeof streetName !== 'string' || streetName.trim() === '') {
    throw new Error('streetName must be a non-empty string');
  }
  if (typeof distanceMeters !== 'number' || distanceMeters < 0) {
    throw new Error('distanceMeters must be a non-negative number');
  }

  const dist = formatDistance(distanceMeters);

  if (direction === TURN_DIRECTIONS.STRAIGHT) {
    return `Continue straight ${dist} onto ${streetName.trim()}`;
  }
  if (direction === TURN_DIRECTIONS.U_TURN) {
    return `Make a U-turn ${dist} onto ${streetName.trim()}`;
  }
  return `Turn ${direction} ${dist} onto ${streetName.trim()}`;
}

/**
 * Generates a voice prompt warning the driver of a speed limit violation.
 *
 * @param {number} currentSpeed - Current vehicle speed in km/h (>= 0)
 * @param {number} speedLimit - Posted speed limit in km/h (> 0)
 * @returns {string} TTS-ready warning string, or an empty string when not speeding
 * @throws {Error} When currentSpeed is negative or not a number
 * @throws {Error} When speedLimit is non-positive or not a number
 */
export function generateSpeedWarningPrompt(currentSpeed, speedLimit) {
  if (typeof currentSpeed !== 'number' || currentSpeed < 0) {
    throw new Error('currentSpeed must be a non-negative number');
  }
  if (typeof speedLimit !== 'number' || speedLimit <= 0) {
    throw new Error('speedLimit must be a positive number');
  }

  if (currentSpeed <= speedLimit) {
    return '';
  }

  const excess = Math.round(currentSpeed - speedLimit);
  return `Warning: you are ${excess} km/h over the speed limit of ${speedLimit} km/h. Please slow down.`;
}
