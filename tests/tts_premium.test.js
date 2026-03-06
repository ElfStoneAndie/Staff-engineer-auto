import { describe, it, expect } from '@jest/globals';
import {
  listPremiumVoices,
  selectVoice,
  generatePremiumTurnPrompt,
  generatePremiumArrivalPrompt,
  generatePremiumRecalculatingPrompt,
  generatePremiumSpeedWarningPrompt,
} from '../src/tts/premium.js';

const KNOWN_VOICE_ID = 'en-US-female-1';

// ---------------------------------------------------------------------------
// listPremiumVoices
// ---------------------------------------------------------------------------
describe('listPremiumVoices', () => {
  it('returns an array of voice profiles', () => {
    const voices = listPremiumVoices();
    expect(Array.isArray(voices)).toBe(true);
    expect(voices.length).toBeGreaterThan(0);
  });

  it('each voice has id, name, locale, and gender fields', () => {
    const voices = listPremiumVoices();
    for (const voice of voices) {
      expect(typeof voice.id).toBe('string');
      expect(typeof voice.name).toBe('string');
      expect(typeof voice.locale).toBe('string');
      expect(typeof voice.gender).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// selectVoice
// ---------------------------------------------------------------------------
describe('selectVoice', () => {
  it('returns the correct voice profile for a known ID', () => {
    const voice = selectVoice(KNOWN_VOICE_ID);
    expect(voice.id).toBe(KNOWN_VOICE_ID);
    expect(typeof voice.name).toBe('string');
  });

  it('throws for an unknown voice ID', () => {
    expect(() => selectVoice('zz-ZZ-unknown')).toThrow('Unknown voice ID: zz-ZZ-unknown');
  });
});

// ---------------------------------------------------------------------------
// generatePremiumTurnPrompt
// ---------------------------------------------------------------------------
describe('generatePremiumTurnPrompt', () => {
  it('returns text and voice for a valid left-turn prompt', () => {
    const result = generatePremiumTurnPrompt('left', 200, KNOWN_VOICE_ID);
    expect(result.text).toBe('In 200 metres, turn left.');
    expect(result.voice.id).toBe(KNOWN_VOICE_ID);
  });

  it('throws for an unrecognised direction', () => {
    expect(() => generatePremiumTurnPrompt('north', 200, KNOWN_VOICE_ID)).toThrow(
      'Unrecognised direction: north',
    );
  });

  it('throws for an unknown voice ID', () => {
    expect(() => generatePremiumTurnPrompt('left', 200, 'bad-id')).toThrow(
      'Unknown voice ID: bad-id',
    );
  });
});

// ---------------------------------------------------------------------------
// generatePremiumArrivalPrompt
// ---------------------------------------------------------------------------
describe('generatePremiumArrivalPrompt', () => {
  it('returns arrival text with destination and voice', () => {
    const result = generatePremiumArrivalPrompt('Golden Gate Park', KNOWN_VOICE_ID);
    expect(result.text).toBe('You have arrived at Golden Gate Park.');
    expect(result.voice.id).toBe(KNOWN_VOICE_ID);
  });

  it('returns generic arrival text when no destination provided', () => {
    const result = generatePremiumArrivalPrompt(undefined, KNOWN_VOICE_ID);
    expect(result.text).toBe('You have arrived at your destination.');
  });

  it('throws for an unknown voice ID', () => {
    expect(() => generatePremiumArrivalPrompt('Somewhere', 'bad-id')).toThrow(
      'Unknown voice ID: bad-id',
    );
  });
});

// ---------------------------------------------------------------------------
// generatePremiumRecalculatingPrompt
// ---------------------------------------------------------------------------
describe('generatePremiumRecalculatingPrompt', () => {
  it('returns recalculating text with voice', () => {
    const result = generatePremiumRecalculatingPrompt(KNOWN_VOICE_ID);
    expect(result.text).toBe('Recalculating route. Please follow the new directions.');
    expect(result.voice.id).toBe(KNOWN_VOICE_ID);
  });

  it('throws for an unknown voice ID', () => {
    expect(() => generatePremiumRecalculatingPrompt('bad-id')).toThrow(
      'Unknown voice ID: bad-id',
    );
  });
});

// ---------------------------------------------------------------------------
// generatePremiumSpeedWarningPrompt
// ---------------------------------------------------------------------------
describe('generatePremiumSpeedWarningPrompt', () => {
  it('returns speed warning text with voice', () => {
    const result = generatePremiumSpeedWarningPrompt(60, KNOWN_VOICE_ID);
    expect(result.text).toBe('Speed limit is 60 kilometres per hour.');
    expect(result.voice.id).toBe(KNOWN_VOICE_ID);
  });

  it('throws for invalid speed limit', () => {
    expect(() => generatePremiumSpeedWarningPrompt(0, KNOWN_VOICE_ID)).toThrow(
      'Speed limit must be a positive number',
    );
  });

  it('throws for an unknown voice ID', () => {
    expect(() => generatePremiumSpeedWarningPrompt(60, 'bad-id')).toThrow(
      'Unknown voice ID: bad-id',
    );
  });
});
