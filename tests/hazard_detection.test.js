import { describe, it, expect } from '@jest/globals';
import {
  DEFAULT_ALERT_RADIUS_METERS,
  HAZARD_TYPES,
  detectNearbyHazards,
  getMostSevereHazard,
} from '../src/hazard_detection/index.js';

// Coordinates used across tests
const sf = { lat: 37.7749, lng: -122.4194 };
// ~200 m north of SF
const nearSf = { lat: 37.7767, lng: -122.4194 };
// ~1 km north of SF
const kmNorthSf = { lat: 37.7839, lng: -122.4194 };

const roadWorksNear = { id: 'h1', type: HAZARD_TYPES.ROAD_WORKS, position: nearSf };
const accidentFar = { id: 'h2', type: HAZARD_TYPES.ACCIDENT, position: kmNorthSf };

// ---------------------------------------------------------------------------
// detectNearbyHazards
// ---------------------------------------------------------------------------
describe('detectNearbyHazards', () => {
  it('returns an empty array when there are no hazards', () => {
    expect(detectNearbyHazards(sf, [])).toEqual([]);
  });

  it('detects a hazard within the default radius', () => {
    const result = detectNearbyHazards(sf, [roadWorksNear]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h1');
  });

  it('excludes hazards beyond the specified radius', () => {
    const result = detectNearbyHazards(sf, [roadWorksNear, accidentFar], 300);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h1');
  });

  it('includes all hazards when the radius is large enough', () => {
    const result = detectNearbyHazards(sf, [roadWorksNear, accidentFar], 2000);
    expect(result).toHaveLength(2);
  });

  it('annotates each result with distanceMeters', () => {
    const result = detectNearbyHazards(sf, [roadWorksNear]);
    expect(typeof result[0].distanceMeters).toBe('number');
    expect(result[0].distanceMeters).toBeGreaterThan(0);
    expect(result[0].distanceMeters).toBeLessThan(300);
  });

  it('sorts results nearest-first', () => {
    const result = detectNearbyHazards(sf, [accidentFar, roadWorksNear], 2000);
    expect(result[0].id).toBe('h1');
    expect(result[1].id).toBe('h2');
  });

  it('uses DEFAULT_ALERT_RADIUS_METERS when no radius is supplied', () => {
    // nearSf is ~200 m away — within 500 m default; kmNorthSf is ~1 km — outside
    const result = detectNearbyHazards(sf, [roadWorksNear, accidentFar]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h1');
  });

  it('preserves hazard properties on the returned objects', () => {
    const hazardWithDesc = {
      id: 'h3',
      type: HAZARD_TYPES.SPEED_CAMERA,
      position: nearSf,
      description: 'Fixed camera',
    };
    const result = detectNearbyHazards(sf, [hazardWithDesc]);
    expect(result[0].description).toBe('Fixed camera');
    expect(result[0].type).toBe(HAZARD_TYPES.SPEED_CAMERA);
  });

  it('skips malformed hazard entries (missing position)', () => {
    const malformed = { id: 'bad', type: HAZARD_TYPES.DEBRIS };
    const result = detectNearbyHazards(sf, [malformed, roadWorksNear]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h1');
  });

  it('detects a hazard at exactly the radius boundary', () => {
    // Use a very large radius so nearSf is definitely within it
    const result = detectNearbyHazards(sf, [roadWorksNear], 300);
    expect(result).toHaveLength(1);
  });

  it('throws when position is not an object', () => {
    expect(() => detectNearbyHazards(null, [])).toThrow('position must be an object');
  });

  it('throws when position lacks lat/lng', () => {
    expect(() => detectNearbyHazards({ lat: 37.7749 }, [])).toThrow(
      'position must be an object',
    );
  });

  it('throws for a non-positive radiusMeters', () => {
    expect(() => detectNearbyHazards(sf, [], 0)).toThrow('radiusMeters must be a positive number');
  });

  it('throws when hazards is not an array', () => {
    expect(() => detectNearbyHazards(sf, 'bad')).toThrow('hazards must be an array');
  });

  it('exposes DEFAULT_ALERT_RADIUS_METERS constant', () => {
    expect(DEFAULT_ALERT_RADIUS_METERS).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// getMostSevereHazard
// ---------------------------------------------------------------------------
describe('getMostSevereHazard', () => {
  it('returns null for an empty array', () => {
    expect(getMostSevereHazard([])).toBeNull();
  });

  it('returns null for a non-array input', () => {
    expect(getMostSevereHazard(null)).toBeNull();
  });

  it('returns the single hazard when the array has one element', () => {
    const h = { id: 'h1', type: HAZARD_TYPES.DEBRIS };
    expect(getMostSevereHazard([h])).toBe(h);
  });

  it('ranks road_closure as the most severe', () => {
    const hazards = [
      { type: HAZARD_TYPES.ACCIDENT },
      { type: HAZARD_TYPES.ROAD_CLOSURE },
      { type: HAZARD_TYPES.ROAD_WORKS },
    ];
    expect(getMostSevereHazard(hazards).type).toBe(HAZARD_TYPES.ROAD_CLOSURE);
  });

  it('ranks accident above road_works', () => {
    const hazards = [
      { type: HAZARD_TYPES.ROAD_WORKS },
      { type: HAZARD_TYPES.ACCIDENT },
    ];
    expect(getMostSevereHazard(hazards).type).toBe(HAZARD_TYPES.ACCIDENT);
  });

  it('ranks speed_camera as least severe', () => {
    const hazards = [
      { type: HAZARD_TYPES.SPEED_CAMERA },
      { type: HAZARD_TYPES.DEBRIS },
    ];
    expect(getMostSevereHazard(hazards).type).toBe(HAZARD_TYPES.DEBRIS);
  });

  it('HAZARD_TYPES contains all expected keys', () => {
    expect(HAZARD_TYPES.ROAD_WORKS).toBe('road_works');
    expect(HAZARD_TYPES.ACCIDENT).toBe('accident');
    expect(HAZARD_TYPES.SPEED_CAMERA).toBe('speed_camera');
    expect(HAZARD_TYPES.ROAD_CLOSURE).toBe('road_closure');
    expect(HAZARD_TYPES.DEBRIS).toBe('debris');
  });
});
