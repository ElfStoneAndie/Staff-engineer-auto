import { describe, it, expect } from '@jest/globals';
import {
  isValidCoordinate,
  generateRoute,
  randomizeRoute,
  haversineDistance,
  generateVoicePrompt,
} from '../src/navigation/index.js';

// ---------------------------------------------------------------------------
// isValidCoordinate
// ---------------------------------------------------------------------------
describe('isValidCoordinate', () => {
  it('returns true for valid coordinates', () => {
    expect(isValidCoordinate({ lat: 0, lng: 0 })).toBe(true);
    expect(isValidCoordinate({ lat: 90, lng: 180 })).toBe(true);
    expect(isValidCoordinate({ lat: -90, lng: -180 })).toBe(true);
    expect(isValidCoordinate({ lat: 37.7749, lng: -122.4194 })).toBe(true);
  });

  it('returns false for out-of-range values', () => {
    expect(isValidCoordinate({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidCoordinate({ lat: 0, lng: 181 })).toBe(false);
    expect(isValidCoordinate({ lat: -91, lng: 0 })).toBe(false);
  });

  it('returns false for non-numeric or missing fields', () => {
    expect(isValidCoordinate({ lat: 'a', lng: 0 })).toBe(false);
    expect(isValidCoordinate({ lat: 0 })).toBe(false);
    expect(isValidCoordinate(null)).toBe(false);
    expect(isValidCoordinate(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// haversineDistance
// ---------------------------------------------------------------------------
describe('haversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
  });

  it('returns approximately 111 km per degree of latitude', () => {
    const dist = haversineDistance({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(dist).toBeGreaterThan(110);
    expect(dist).toBeLessThan(112);
  });

  it('calculates the known distance between two cities', () => {
    // London to Paris is roughly 341 km
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    const dist = haversineDistance(london, paris);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(350);
  });
});

// ---------------------------------------------------------------------------
// generateRoute
// ---------------------------------------------------------------------------
describe('generateRoute', () => {
  const origin = { lat: 0, lng: 0 };
  const destination = { lat: 1, lng: 1 };

  it('returns waypoints starting at origin and ending at destination', () => {
    const { waypoints } = generateRoute(origin, destination, 3);
    expect(waypoints[0]).toEqual(origin);
    expect(waypoints[waypoints.length - 1]).toEqual(destination);
  });

  it('returns steps + 2 waypoints (including endpoints)', () => {
    const { waypoints } = generateRoute(origin, destination, 4);
    expect(waypoints).toHaveLength(6); // 4 intermediate + origin + destination
  });

  it('includes a positive distance value', () => {
    const { distance } = generateRoute(origin, destination);
    expect(distance).toBeGreaterThan(0);
  });

  it('defaults to 5 intermediate steps', () => {
    const { waypoints } = generateRoute(origin, destination);
    expect(waypoints).toHaveLength(7); // 5 + 2
  });

  it('throws on invalid origin', () => {
    expect(() => generateRoute({ lat: 200, lng: 0 }, destination)).toThrow(
      'Invalid origin coordinate',
    );
  });

  it('throws on invalid destination', () => {
    expect(() => generateRoute(origin, { lat: 0, lng: 200 })).toThrow(
      'Invalid destination coordinate',
    );
  });
});

// ---------------------------------------------------------------------------
// randomizeRoute
// ---------------------------------------------------------------------------
describe('randomizeRoute', () => {
  it('preserves origin and destination', () => {
    const waypoints = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ];
    const shuffled = randomizeRoute(waypoints);
    expect(shuffled[0]).toEqual(waypoints[0]);
    expect(shuffled[shuffled.length - 1]).toEqual(waypoints[waypoints.length - 1]);
  });

  it('returns all original waypoints', () => {
    const waypoints = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ];
    const shuffled = randomizeRoute(waypoints);
    expect(shuffled).toHaveLength(waypoints.length);
    expect(shuffled).toEqual(expect.arrayContaining(waypoints));
  });

  it('returns a copy when fewer than 2 waypoints', () => {
    const single = [{ lat: 0, lng: 0 }];
    const result = randomizeRoute(single);
    expect(result).not.toBe(single);
    expect(result).toEqual(single);
    expect(randomizeRoute([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// generateVoicePrompt
// ---------------------------------------------------------------------------
describe('generateVoicePrompt', () => {
  it('returns a string containing the step number', () => {
    const from = { lat: 0, lng: 0 };
    const to = { lat: 1, lng: 1 };
    const prompt = generateVoicePrompt(from, to, 1);
    expect(typeof prompt).toBe('string');
    expect(prompt).toMatch(/Step 1/);
  });

  it('uses metres when distance is less than 1 km', () => {
    const from = { lat: 51.5074, lng: -0.1278 };
    const to = { lat: 51.5075, lng: -0.1279 }; // very close
    const prompt = generateVoicePrompt(from, to, 2);
    expect(prompt).toMatch(/metres/);
  });

  it('uses kilometres when distance is 1 km or more', () => {
    const from = { lat: 0, lng: 0 };
    const to = { lat: 1, lng: 1 };
    const prompt = generateVoicePrompt(from, to, 3);
    expect(prompt).toMatch(/kilometres/);
  });

  it('includes directional hint', () => {
    const from = { lat: 0, lng: 0 };
    const to = { lat: 1, lng: 1 };
    const prompt = generateVoicePrompt(from, to, 1);
    expect(prompt).toMatch(/north-east/);
  });
});
