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
  it('formats metres below 1000', () => {
    expect(formatDistance(200)).toBe('200 metres');
    expect(formatDistance(0)).toBe('0 metres');
  });

  it('formats metres >= 1000 as kilometres', () => {
    expect(formatDistance(1000)).toBe('1.0 kilometres');
    expect(formatDistance(1500)).toBe('1.5 kilometres');
  });

  it('throws for negative distances', () => {
    expect(() => formatDistance(-1)).toThrow('Distance must be a non-negative number');
  });

  it('throws for non-numeric input', () => {
    expect(() => formatDistance('far')).toThrow('Distance must be a non-negative number');
  });
});

// ---------------------------------------------------------------------------
// generateTurnPrompt
// ---------------------------------------------------------------------------
describe('generateTurnPrompt', () => {
  it('generates a left turn prompt', () => {
    expect(generateTurnPrompt('left', 200)).toBe('In 200 metres, turn left.');
  });

  it('generates a right turn prompt', () => {
    expect(generateTurnPrompt('right', 200)).toBe('In 200 metres, turn right.');
  });

  it('generates a straight prompt', () => {
    expect(generateTurnPrompt('straight', 500)).toBe('In 500 metres, continue straight ahead.');
  });

  it('generates a u-turn prompt', () => {
    expect(generateTurnPrompt('u-turn', 100)).toBe('In 100 metres, make a U-turn.');
  });

  it('formats distance in kilometres when >= 1000 m', () => {
    expect(generateTurnPrompt('left', 2000)).toBe('In 2.0 kilometres, turn left.');
  });

  it('throws for unrecognised direction', () => {
    expect(() => generateTurnPrompt('north', 200)).toThrow('Unrecognised direction: north');
  });
});

// ---------------------------------------------------------------------------
// generateArrivalPrompt
// ---------------------------------------------------------------------------
describe('generateArrivalPrompt', () => {
  it('returns a generic arrival prompt when no destination is given', () => {
    expect(generateArrivalPrompt()).toBe('You have arrived at your destination.');
  });

  it('includes destination name when provided', () => {
    expect(generateArrivalPrompt('Golden Gate Park')).toBe(
      'You have arrived at Golden Gate Park.',
    );
  });

  it('trims whitespace from destination name', () => {
    expect(generateArrivalPrompt('  Home  ')).toBe('You have arrived at Home.');
  });

  it('returns generic prompt for empty string destination', () => {
    expect(generateArrivalPrompt('')).toBe('You have arrived at your destination.');
  });
});

// ---------------------------------------------------------------------------
// generateRecalculatingPrompt
// ---------------------------------------------------------------------------
describe('generateRecalculatingPrompt', () => {
  it('returns the recalculating prompt string', () => {
    expect(generateRecalculatingPrompt()).toBe(
      'Recalculating route. Please follow the new directions.',
    );
  });
});

// ---------------------------------------------------------------------------
// generateSpeedWarningPrompt
// ---------------------------------------------------------------------------
describe('generateSpeedWarningPrompt', () => {
  it('includes the speed limit in the prompt', () => {
    expect(generateSpeedWarningPrompt(60)).toBe('Speed limit is 60 kilometres per hour.');
  });

  it('throws for zero speed limit', () => {
    expect(() => generateSpeedWarningPrompt(0)).toThrow('Speed limit must be a positive number');
  });

  it('throws for negative speed limit', () => {
    expect(() => generateSpeedWarningPrompt(-30)).toThrow(
      'Speed limit must be a positive number',
    );
  });

  it('throws for non-numeric speed limit', () => {
    expect(() => generateSpeedWarningPrompt('fast')).toThrow(
      'Speed limit must be a positive number',
    );
  });
});
