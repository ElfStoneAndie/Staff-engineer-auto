import { describe, it, expect } from '@jest/globals';
import {
  createLoopSpec,
  validateLoop,
  generateSectorWaypoints,
  isWithinTargetLength,
} from '../src/loop_generator/index.js';

// ---------------------------------------------------------------------------
// Shared fixture — a small closed loop near San Francisco Airport
// ---------------------------------------------------------------------------
const SFO_LOOP_WPS = [
  { lat: 37.6213, lng: -122.379, streetName: 'Terminal Blvd' },
  { lat: 37.615, lng: -122.378, streetName: 'Airport Blvd' },
  { lat: 37.61, lng: -122.385, streetName: 'Millbrae Ave' },
  { lat: 37.6213, lng: -122.379, streetName: 'Terminal Blvd' }, // closed
];

const BASE_PARAMS = {
  city: 'San Francisco, CA',
  minLengthMiles: 1,
  maxLengthMiles: 5,
  trackType: 'Technical',
  seriesFocus: 'Formula One',
  direction: 'Clockwise',
  waypoints: SFO_LOOP_WPS,
};

// ---------------------------------------------------------------------------
// createLoopSpec
// ---------------------------------------------------------------------------
describe('createLoopSpec', () => {
  it('returns a valid closed loop spec for well-formed params', () => {
    const loop = createLoopSpec(BASE_PARAMS);
    expect(loop.city).toBe('San Francisco, CA');
    expect(loop.trackType).toBe('Technical');
    expect(loop.seriesFocus).toBe('Formula One');
    expect(loop.direction).toBe('Clockwise');
    expect(loop.isClosed).toBe(true);
    expect(loop.waypoints).toHaveLength(4);
  });

  it('marks loop as open when first and last waypoint differ', () => {
    const params = {
      ...BASE_PARAMS,
      waypoints: [
        { lat: 37.6213, lng: -122.379, streetName: 'Terminal Blvd' },
        { lat: 37.615, lng: -122.378, streetName: 'Airport Blvd' },
        { lat: 37.61, lng: -122.385, streetName: 'Millbrae Ave' },
      ],
    };
    const loop = createLoopSpec(params);
    expect(loop.isClosed).toBe(false);
  });

  it('trims whitespace from city', () => {
    const loop = createLoopSpec({ ...BASE_PARAMS, city: '  Los Angeles  ' });
    expect(loop.city).toBe('Los Angeles');
  });

  it('throws when city is an empty string', () => {
    expect(() => createLoopSpec({ ...BASE_PARAMS, city: '' })).toThrow('city is required');
  });

  it('throws when city is not a string', () => {
    expect(() => createLoopSpec({ ...BASE_PARAMS, city: 42 })).toThrow('city is required');
  });

  it('throws when minLengthMiles >= maxLengthMiles', () => {
    expect(() =>
      createLoopSpec({ ...BASE_PARAMS, minLengthMiles: 5, maxLengthMiles: 5 }),
    ).toThrow('minLengthMiles must be less than maxLengthMiles');
  });

  it('throws for an invalid trackType', () => {
    expect(() => createLoopSpec({ ...BASE_PARAMS, trackType: 'Oval' })).toThrow('trackType');
  });

  it('throws for an invalid seriesFocus', () => {
    expect(() => createLoopSpec({ ...BASE_PARAMS, seriesFocus: 'NASCAR' })).toThrow('seriesFocus');
  });

  it('throws for an invalid direction', () => {
    expect(() => createLoopSpec({ ...BASE_PARAMS, direction: 'North' })).toThrow('direction');
  });

  it('throws when fewer than 3 waypoints are provided', () => {
    expect(() =>
      createLoopSpec({ ...BASE_PARAMS, waypoints: [SFO_LOOP_WPS[0], SFO_LOOP_WPS[1]] }),
    ).toThrow('waypoints');
  });
});

// ---------------------------------------------------------------------------
// validateLoop
// ---------------------------------------------------------------------------
describe('validateLoop', () => {
  it('returns valid for a well-formed closed loop', () => {
    const loop = createLoopSpec(BASE_PARAMS);
    const result = validateLoop(loop);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports an error when the loop is not closed', () => {
    const loop = { isClosed: false, waypoints: SFO_LOOP_WPS };
    const result = validateLoop(loop);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'loop must be closed (first and last waypoint must match)',
    );
  });

  it('reports an error for duplicate consecutive street names', () => {
    const dupWaypoints = [
      { lat: 37.62, lng: -122.38, streetName: 'Terminal Blvd' },
      { lat: 37.61, lng: -122.37, streetName: 'Terminal Blvd' },
      { lat: 37.6, lng: -122.39, streetName: 'Airport Blvd' },
      { lat: 37.62, lng: -122.38, streetName: 'Terminal Blvd' },
    ];
    const result = validateLoop({ isClosed: true, waypoints: dupWaypoints });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('duplicate consecutive street');
  });

  it('returns invalid when waypoints array is empty', () => {
    const result = validateLoop({ isClosed: false, waypoints: [] });
    expect(result.valid).toBe(false);
  });

  it('returns invalid when loop is null', () => {
    const result = validateLoop(null);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateSectorWaypoints
// ---------------------------------------------------------------------------
describe('generateSectorWaypoints', () => {
  const SEVEN_WPS = Array.from({ length: 7 }, (_, i) => ({ lat: i, lng: i }));

  it('splits a 7-waypoint loop into the default 3 sectors', () => {
    const sectors = generateSectorWaypoints({ waypoints: SEVEN_WPS });
    expect(sectors).toHaveLength(3);
    sectors.forEach((s, idx) => expect(s.sector).toBe(idx + 1));
  });

  it('each sector contains at least 2 waypoints', () => {
    const sectors = generateSectorWaypoints({ waypoints: SEVEN_WPS });
    sectors.forEach((s) => expect(s.waypoints.length).toBeGreaterThanOrEqual(2));
  });

  it('accepts a custom numSectors value', () => {
    const wps = Array.from({ length: 6 }, (_, i) => ({ lat: i, lng: i }));
    const sectors = generateSectorWaypoints({ waypoints: wps }, 2);
    expect(sectors).toHaveLength(2);
  });

  it('throws when numSectors exceeds the waypoint count', () => {
    expect(() =>
      generateSectorWaypoints({ waypoints: [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }] }, 5),
    ).toThrow('numSectors cannot exceed');
  });

  it('throws when numSectors is less than 1', () => {
    expect(() => generateSectorWaypoints({ waypoints: SFO_LOOP_WPS }, 0)).toThrow(
      'numSectors must be a positive number',
    );
  });

  it('throws when loop has no waypoints array', () => {
    expect(() => generateSectorWaypoints({})).toThrow('loop must have a waypoints array');
  });
});

// ---------------------------------------------------------------------------
// isWithinTargetLength
// ---------------------------------------------------------------------------
describe('isWithinTargetLength', () => {
  it('returns true when loop distance is within the target range', () => {
    // SFO_LOOP_WPS total ≈ 1.8 miles — fits comfortably in [0, 10]
    const loop = createLoopSpec({ ...BASE_PARAMS, minLengthMiles: 0, maxLengthMiles: 10 });
    expect(isWithinTargetLength(loop)).toBe(true);
  });

  it('returns false when loop distance exceeds maxLengthMiles', () => {
    const loop = createLoopSpec({ ...BASE_PARAMS, minLengthMiles: 100, maxLengthMiles: 200 });
    expect(isWithinTargetLength(loop)).toBe(false);
  });

  it('returns false when loop distance is below minLengthMiles', () => {
    const loop = createLoopSpec({ ...BASE_PARAMS, minLengthMiles: 50, maxLengthMiles: 100 });
    expect(isWithinTargetLength(loop)).toBe(false);
  });

  it('returns false for an empty waypoints array', () => {
    expect(
      isWithinTargetLength({ waypoints: [], minLengthMiles: 0, maxLengthMiles: 10 }),
    ).toBe(false);
  });

  it('returns false when loop is null', () => {
    expect(isWithinTargetLength(null)).toBe(false);
  });
});
