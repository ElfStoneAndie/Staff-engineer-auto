/**
 * TTS Premium Voices — Phase 2 Premium
 *
 * Extends the core TTS engine with diverse, high-quality voice options for
 * premium subscribers.  Wraps the base prompt generators with a chosen voice
 * profile so that the downstream synthesiser can select the correct voice.
 */

import {
  generateTurnPrompt,
  generateArrivalPrompt,
  generateRecalculatingPrompt,
  generateSpeedWarningPrompt,
} from './index.js';

/** @type {Map<string, { id: string, name: string, locale: string, gender: string }>} */
const PREMIUM_VOICES = new Map([
  ['en-US-female-1', { id: 'en-US-female-1', name: 'Aria', locale: 'en-US', gender: 'female' }],
  ['en-US-male-1', { id: 'en-US-male-1', name: 'Davis', locale: 'en-US', gender: 'male' }],
  ['en-GB-female-1', { id: 'en-GB-female-1', name: 'Sonia', locale: 'en-GB', gender: 'female' }],
  ['en-GB-male-1', { id: 'en-GB-male-1', name: 'Ryan', locale: 'en-GB', gender: 'male' }],
  ['es-ES-female-1', { id: 'es-ES-female-1', name: 'Elvira', locale: 'es-ES', gender: 'female' }],
]);

/**
 * Returns all available premium voice profiles.
 *
 * @returns {Array<{ id: string, name: string, locale: string, gender: string }>}
 *   Array of voice profile descriptors
 */
export function listPremiumVoices() {
  return Array.from(PREMIUM_VOICES.values());
}

/**
 * Retrieves a single premium voice profile by its identifier.
 *
 * @param {string} voiceId - Voice profile identifier (e.g. 'en-US-female-1')
 * @returns {{ id: string, name: string, locale: string, gender: string }}
 * @throws {Error} When the voice ID is not found
 */
export function selectVoice(voiceId) {
  const voice = PREMIUM_VOICES.get(voiceId);
  if (!voice) {
    throw new Error(`Unknown voice ID: ${voiceId}`);
  }
  return voice;
}

/**
 * Generates a turn navigation prompt tagged with a premium voice profile.
 *
 * @param {'left'|'right'|'straight'|'u-turn'} direction - Turn direction
 * @param {number} distanceMetres - Distance in metres until the turn
 * @param {string} voiceId - Premium voice profile identifier
 * @returns {{ text: string, voice: { id: string, name: string, locale: string, gender: string } }}
 * @throws {Error} When direction, distance or voiceId are invalid
 */
export function generatePremiumTurnPrompt(direction, distanceMetres, voiceId) {
  const text = generateTurnPrompt(direction, distanceMetres);
  const voice = selectVoice(voiceId);
  return { text, voice };
}

/**
 * Generates an arrival prompt tagged with a premium voice profile.
 *
 * @param {string|undefined} destination - Optional destination name
 * @param {string} voiceId - Premium voice profile identifier
 * @returns {{ text: string, voice: { id: string, name: string, locale: string, gender: string } }}
 * @throws {Error} When voiceId is invalid
 */
export function generatePremiumArrivalPrompt(destination, voiceId) {
  const text = generateArrivalPrompt(destination);
  const voice = selectVoice(voiceId);
  return { text, voice };
}

/**
 * Generates a route recalculation prompt tagged with a premium voice profile.
 *
 * @param {string} voiceId - Premium voice profile identifier
 * @returns {{ text: string, voice: { id: string, name: string, locale: string, gender: string } }}
 * @throws {Error} When voiceId is invalid
 */
export function generatePremiumRecalculatingPrompt(voiceId) {
  const text = generateRecalculatingPrompt();
  const voice = selectVoice(voiceId);
  return { text, voice };
}

/**
 * Generates a speed warning prompt tagged with a premium voice profile.
 *
 * @param {number} speedLimit - Speed limit in km/h
 * @param {string} voiceId - Premium voice profile identifier
 * @returns {{ text: string, voice: { id: string, name: string, locale: string, gender: string } }}
 * @throws {Error} When speedLimit or voiceId are invalid
 */
export function generatePremiumSpeedWarningPrompt(speedLimit, voiceId) {
  const text = generateSpeedWarningPrompt(speedLimit);
  const voice = selectVoice(voiceId);
  return { text, voice };
}
