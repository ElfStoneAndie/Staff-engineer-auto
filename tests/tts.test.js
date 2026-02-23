import { describe, it, expect } from '@jest/globals';
import {
  TURN_DIRECTIONS,
  generateTurnPrompt,
  generateSpeedWarningPrompt,
} from '../src/tts/index.js';

// ---------------------------------------------------------------------------
// generateTurnPrompt
// ---------------------------------------------------------------------------
describe('generateTurnPrompt', () => {
  it('generates a left-turn prompt for distances under 1 km', () => {
    const prompt = generateTurnPrompt('left', 'Main Street', 200);
    expect(prompt).toBe('Turn left in 200 metres onto Main Street');
  });

  it('generates a right-turn prompt', () => {
    const prompt = generateTurnPrompt('right', 'Oak Avenue', 50);
    expect(prompt).toBe('Turn right in 50 metres onto Oak Avenue');
  });

  it('generates a straight-ahead prompt', () => {
    const prompt = generateTurnPrompt('straight', 'Highway 1', 800);
    expect(prompt).toBe('Continue straight in 800 metres onto Highway 1');
  });

  it('generates a U-turn prompt', () => {
    const prompt = generateTurnPrompt('u-turn', 'Elm Road', 300);
    expect(prompt).toBe('Make a U-turn in 300 metres onto Elm Road');
  });

  it('formats distances >= 1000 m in kilometres', () => {
    const prompt = generateTurnPrompt('left', 'Park Drive', 1500);
    expect(prompt).toBe('Turn left in 1.5 kilometres onto Park Drive');
  });

  it('handles exactly 1000 m as 1.0 kilometres', () => {
    const prompt = generateTurnPrompt('right', 'Bridge Street', 1000);
    expect(prompt).toBe('Turn right in 1.0 kilometres onto Bridge Street');
  });

  it('handles distance of 0 metres', () => {
    const prompt = generateTurnPrompt('left', 'Now Street', 0);
    expect(prompt).toBe('Turn left in 0 metres onto Now Street');
  });

  it('trims whitespace from streetName', () => {
    const prompt = generateTurnPrompt('right', '  Maple Lane  ', 100);
    expect(prompt).toBe('Turn right in 100 metres onto Maple Lane');
  });

  it('throws for an invalid direction', () => {
    expect(() => generateTurnPrompt('diagonal', 'Main Street', 100)).toThrow(
      'Invalid direction: "diagonal"',
    );
  });

  it('throws for an empty streetName', () => {
    expect(() => generateTurnPrompt('left', '', 100)).toThrow(
      'streetName must be a non-empty string',
    );
  });

  it('throws for a non-string streetName', () => {
    expect(() => generateTurnPrompt('left', 42, 100)).toThrow(
      'streetName must be a non-empty string',
    );
  });

  it('throws for a negative distanceMeters', () => {
    expect(() => generateTurnPrompt('left', 'Main Street', -1)).toThrow(
      'distanceMeters must be a non-negative number',
    );
  });

  it('throws for a non-numeric distanceMeters', () => {
    expect(() => generateTurnPrompt('left', 'Main Street', '200')).toThrow(
      'distanceMeters must be a non-negative number',
    );
  });

  it('TURN_DIRECTIONS contains all expected keys', () => {
    expect(TURN_DIRECTIONS.LEFT).toBe('left');
    expect(TURN_DIRECTIONS.RIGHT).toBe('right');
    expect(TURN_DIRECTIONS.STRAIGHT).toBe('straight');
    expect(TURN_DIRECTIONS.U_TURN).toBe('u-turn');
  });
});

// ---------------------------------------------------------------------------
// generateSpeedWarningPrompt
// ---------------------------------------------------------------------------
describe('generateSpeedWarningPrompt', () => {
  it('returns empty string when at the speed limit', () => {
    expect(generateSpeedWarningPrompt(60, 60)).toBe('');
  });

  it('returns empty string when below the speed limit', () => {
    expect(generateSpeedWarningPrompt(45, 60)).toBe('');
  });

  it('returns a warning when exceeding the speed limit', () => {
    const prompt = generateSpeedWarningPrompt(80, 60);
    expect(prompt).toBe(
      'Warning: you are 20 km/h over the speed limit of 60 km/h. Please slow down.',
    );
  });

  it('rounds the excess speed to the nearest km/h', () => {
    const prompt = generateSpeedWarningPrompt(70.6, 60);
    expect(prompt).toContain('11 km/h over');
  });

  it('includes the speed limit in the warning', () => {
    const prompt = generateSpeedWarningPrompt(120, 100);
    expect(prompt).toContain('100 km/h');
  });

  it('throws for negative currentSpeed', () => {
    expect(() => generateSpeedWarningPrompt(-1, 60)).toThrow(
      'currentSpeed must be a non-negative number',
    );
  });

  it('throws for non-numeric currentSpeed', () => {
    expect(() => generateSpeedWarningPrompt('fast', 60)).toThrow(
      'currentSpeed must be a non-negative number',
    );
  });

  it('throws for zero speedLimit', () => {
    expect(() => generateSpeedWarningPrompt(30, 0)).toThrow(
      'speedLimit must be a positive number',
    );
  });

  it('throws for negative speedLimit', () => {
    expect(() => generateSpeedWarningPrompt(30, -50)).toThrow(
      'speedLimit must be a positive number',
    );
  });

  it('throws for non-numeric speedLimit', () => {
    expect(() => generateSpeedWarningPrompt(30, '60')).toThrow(
      'speedLimit must be a positive number',
    );
  });
});
