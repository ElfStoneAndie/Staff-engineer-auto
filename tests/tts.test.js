import { describe, it, expect } from '@jest/globals';
import {
  formatDistance,
  generateTurnPrompt,
  generateArrivalPrompt,
  generateRecalculatingPrompt,
  generateSpeedWarningPrompt,
} from '../src/tts/index.js';

// ---------------------------------------------------------------------------
// formatDistance
// ---------------------------------------------------------------------------
describe('formatDistance', () => {
  it('formats values below 1000 m in metres', () => {
    expect(formatDistance(0)).toBe('0 metres');
    expect(formatDistance(200)).toBe('200 metres');
    expect(formatDistance(999)).toBe('999 metres');
  });

  it('formats values >= 1000 m in kilometres', () => {
    expect(formatDistance(1000)).toBe('1 kilometre');
    expect(formatDistance(1500)).toBe('1.5 kilometres');
    expect(formatDistance(10000)).toBe('10 kilometres');
  });
});

// ---------------------------------------------------------------------------
// generateTurnPrompt
// ---------------------------------------------------------------------------
describe('generateTurnPrompt', () => {
  it('generates a left-turn prompt in metres', () => {
    expect(generateTurnPrompt('left', 200)).toBe('In 200 metres, turn left.');
  });

  it('generates a right-turn prompt in kilometres', () => {
    expect(generateTurnPrompt('right', 1000)).toBe('In 1 kilometre, turn right.');
  });

  it('generates a u-turn prompt', () => {
    expect(generateTurnPrompt('u-turn', 1500)).toBe('In 1.5 kilometres, make a U-turn.');
  });

  it('throws when direction is empty', () => {
    expect(() => generateTurnPrompt('', 200)).toThrow('direction must be a non-empty string');
  });

  it('throws when distanceMetres is negative', () => {
    expect(() => generateTurnPrompt('left', -1)).toThrow(
      'distanceMetres must be a non-negative number',
    );
  });
});

// ---------------------------------------------------------------------------
// generateArrivalPrompt
// ---------------------------------------------------------------------------
describe('generateArrivalPrompt', () => {
  it('generates an arrival prompt', () => {
    expect(generateArrivalPrompt('Golden Gate')).toBe('You have arrived at Golden Gate.');
  });

  it('trims whitespace from the destination name', () => {
    expect(generateArrivalPrompt('  Home  ')).toBe('You have arrived at Home.');
  });

  it('throws when destinationName is empty', () => {
    expect(() => generateArrivalPrompt('')).toThrow('destinationName must be a non-empty string');
  });
});

// ---------------------------------------------------------------------------
// generateRecalculatingPrompt
// ---------------------------------------------------------------------------
describe('generateRecalculatingPrompt', () => {
  it('returns the standard recalculating message', () => {
    expect(generateRecalculatingPrompt()).toBe(
      'Recalculating route. Please follow the new directions.',
    );
  });
});

// ---------------------------------------------------------------------------
// generateSpeedWarningPrompt
// ---------------------------------------------------------------------------
describe('generateSpeedWarningPrompt', () => {
  it('generates a speed warning prompt', () => {
    expect(generateSpeedWarningPrompt(60)).toBe('Speed limit is 60 kilometres per hour.');
  });

  it('throws when limitKph is zero', () => {
    expect(() => generateSpeedWarningPrompt(0)).toThrow('limitKph must be a positive number');
  });

  it('throws when limitKph is negative', () => {
    expect(() => generateSpeedWarningPrompt(-30)).toThrow('limitKph must be a positive number');
  });
});
