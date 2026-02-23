import { describe, it, expect } from '@jest/globals';
import {
  HAZARD_TYPES,
  isValidHazard,
  getHazardsNearCoordinate,
  getHazardsAlongRoute,
  generateVoiceWarning,
} from '../src/hazard_detection/index.js';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------
const sf = { lat: 37.7749, lng: -122.4194 };
const la = { lat: 34.0522, lng: -118.2437 };

// A hazard placed exactly on sf
const sfCamera = { type: HAZARD_TYPES.SPEED_CAMERA, lat: sf.lat, lng: sf.lng };
// A hazard placed very close to sf (~0.1 km away)
const sfBump = { type: HAZARD_TYPES.SPEED_BUMP, lat: 37.7758, lng: -122.4194 };
// A hazard placed exactly on la
const laRailroad = { type: HAZARD_TYPES.RAILROAD_CROSSING, lat: la.lat, lng: la.lng };

// ---------------------------------------------------------------------------
// HAZARD_TYPES
// ---------------------------------------------------------------------------
describe('HAZARD_TYPES', () => {
  it('exposes all expected hazard type values', () => {
    const expected = [
      'speed_camera',
      'flock_camera',
      'dip',
      'speed_bump',
      'railroad_crossing',
      'construction',
      'closure',
    ];
    expect(Object.values(HAZARD_TYPES)).toEqual(expect.arrayContaining(expected));
    expect(Object.values(HAZARD_TYPES)).toHaveLength(expected.length);
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(HAZARD_TYPES)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isValidHazard
// ---------------------------------------------------------------------------
describe('isValidHazard', () => {
  it('returns true for a valid hazard with each known type', () => {
    for (const type of Object.values(HAZARD_TYPES)) {
      expect(isValidHazard({ type, lat: 0, lng: 0 })).toBe(true);
    }
  });

  it('returns false for an unknown hazard type', () => {
    expect(isValidHazard({ type: 'unknown_type', lat: 0, lng: 0 })).toBe(false);
  });

  it('returns false when type is missing or not a string', () => {
    expect(isValidHazard({ lat: 0, lng: 0 })).toBe(false);
    expect(isValidHazard({ type: 42, lat: 0, lng: 0 })).toBe(false);
  });

  it('returns false for non-numeric or missing lat/lng', () => {
    expect(isValidHazard({ type: HAZARD_TYPES.DIP, lat: 'a', lng: 0 })).toBe(false);
    expect(isValidHazard({ type: HAZARD_TYPES.DIP, lat: 0 })).toBe(false);
  });

  it('returns false for out-of-range coordinates', () => {
    expect(isValidHazard({ type: HAZARD_TYPES.DIP, lat: 91, lng: 0 })).toBe(false);
    expect(isValidHazard({ type: HAZARD_TYPES.DIP, lat: 0, lng: 181 })).toBe(false);
    expect(isValidHazard({ type: HAZARD_TYPES.DIP, lat: -91, lng: 0 })).toBe(false);
    expect(isValidHazard({ type: HAZARD_TYPES.DIP, lat: 0, lng: -181 })).toBe(false);
  });

  it('returns false for null or undefined input', () => {
    expect(isValidHazard(null)).toBe(false);
    expect(isValidHazard(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getHazardsNearCoordinate
// ---------------------------------------------------------------------------
describe('getHazardsNearCoordinate', () => {
  it('returns hazards within the default radius (0.5 km)', () => {
    const result = getHazardsNearCoordinate([sfCamera, sfBump, laRailroad], sf);
    expect(result).toContain(sfCamera);
    expect(result).toContain(sfBump);
    expect(result).not.toContain(laRailroad);
  });

  it('returns an empty array when no hazards are within the radius', () => {
    const result = getHazardsNearCoordinate([laRailroad], sf);
    expect(result).toHaveLength(0);
  });

  it('respects a custom radius', () => {
    // sfCamera is 0 km from sf — should be included with a very small radius
    const resultSmall = getHazardsNearCoordinate([sfCamera, sfBump], sf, 0.05);
    expect(resultSmall).toContain(sfCamera);
    expect(resultSmall).not.toContain(sfBump);

    // With a large radius both should be included
    const resultLarge = getHazardsNearCoordinate([sfCamera, sfBump], sf, 10);
    expect(resultLarge).toContain(sfCamera);
    expect(resultLarge).toContain(sfBump);
  });

  it('silently ignores invalid hazards', () => {
    const invalid = { type: 'bad', lat: sf.lat, lng: sf.lng };
    const result = getHazardsNearCoordinate([invalid, sfCamera], sf);
    expect(result).not.toContain(invalid);
    expect(result).toContain(sfCamera);
  });

  it('returns an empty array for an empty hazards list', () => {
    expect(getHazardsNearCoordinate([], sf)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getHazardsAlongRoute
// ---------------------------------------------------------------------------
describe('getHazardsAlongRoute', () => {
  const route = { waypoints: [sf, la] };

  it('returns hazards near any waypoint in the route', () => {
    const result = getHazardsAlongRoute([sfCamera, laRailroad], route);
    expect(result).toContain(sfCamera);
    expect(result).toContain(laRailroad);
  });

  it('deduplicates hazards that are near multiple waypoints', () => {
    // Put a hazard that is technically close to both waypoints (same coords as sf)
    const closeToSf = { type: HAZARD_TYPES.CONSTRUCTION, lat: sf.lat, lng: sf.lng };
    const singleWaypointRoute = { waypoints: [sf, sf] };
    const result = getHazardsAlongRoute([closeToSf], singleWaypointRoute);
    expect(result).toHaveLength(1);
  });

  it('returns an empty array when no hazards are near the route', () => {
    const farHazard = { type: HAZARD_TYPES.CLOSURE, lat: 51.5074, lng: -0.1278 }; // London
    const result = getHazardsAlongRoute([farHazard], route);
    expect(result).toHaveLength(0);
  });

  it('returns an empty array for an empty hazards list', () => {
    expect(getHazardsAlongRoute([], route)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateVoiceWarning
// ---------------------------------------------------------------------------
describe('generateVoiceWarning', () => {
  it('returns the correct warning for every known hazard type', () => {
    const expectedMessages = {
      [HAZARD_TYPES.SPEED_CAMERA]: 'Warning: Speed camera ahead.',
      [HAZARD_TYPES.FLOCK_CAMERA]: 'Warning: Flock camera ahead.',
      [HAZARD_TYPES.DIP]: 'Caution: Dip in the road ahead.',
      [HAZARD_TYPES.SPEED_BUMP]: 'Caution: Speed bump ahead.',
      [HAZARD_TYPES.RAILROAD_CROSSING]: 'Warning: Railroad crossing ahead.',
      [HAZARD_TYPES.CONSTRUCTION]: 'Warning: Construction zone ahead.',
      [HAZARD_TYPES.CLOSURE]: 'Warning: Road closure ahead.',
    };

    for (const [type, expected] of Object.entries(expectedMessages)) {
      expect(generateVoiceWarning({ type })).toBe(expected);
    }
  });

  it('throws for an unrecognised hazard type', () => {
    expect(() => generateVoiceWarning({ type: 'unknown' })).toThrow(
      'Unrecognised hazard type: unknown',
    );
  });
});
