import { describe, it, expect } from '@jest/globals';
import {
  isInHazardZone,
  detectHazards,
  nearestHazard,
} from '../src/hazard_detection/index.js';

// San Francisco and surrounding points
const sf = { lat: 37.7749, lng: -122.4194 };
const la = { lat: 34.0522, lng: -118.2437 };

// A hazard zone centred on SF with a 5 km radius
const sfZone = { centre: sf, radiusKm: 5, type: 'construction' };
// A hazard zone centred on LA (far from SF)
const laZone = { centre: la, radiusKm: 5, type: 'roadwork' };

// ---------------------------------------------------------------------------
// isInHazardZone
// ---------------------------------------------------------------------------
describe('isInHazardZone', () => {
  it('returns true when location is within the zone radius', () => {
    // Location is SF itself — distance is 0
    expect(isInHazardZone(sf, sfZone)).toBe(true);
  });

  it('returns false when location is outside the zone radius', () => {
    // SF is ~559 km from LA, well beyond a 5 km zone
    expect(isInHazardZone(sf, laZone)).toBe(false);
  });

  it('returns false for missing location', () => {
    expect(isInHazardZone(null, sfZone)).toBe(false);
  });

  it('returns false for missing zone', () => {
    expect(isInHazardZone(sf, null)).toBe(false);
  });

  it('returns false when zone has no radiusKm', () => {
    expect(isInHazardZone(sf, { centre: sf, type: 'test' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectHazards
// ---------------------------------------------------------------------------
describe('detectHazards', () => {
  it('returns zones that contain the location', () => {
    const active = detectHazards(sf, [sfZone, laZone]);
    expect(active).toHaveLength(1);
    expect(active[0]).toBe(sfZone);
  });

  it('returns an empty array when no zones are active', () => {
    expect(detectHazards(la, [sfZone])).toHaveLength(0);
  });

  it('returns an empty array when zones is empty', () => {
    expect(detectHazards(sf, [])).toHaveLength(0);
  });

  it('returns an empty array when zones is not an array', () => {
    expect(detectHazards(sf, null)).toHaveLength(0);
  });

  it('returns multiple active zones when location is in several', () => {
    const otherSfZone = { centre: sf, radiusKm: 10, type: 'flooding' };
    const active = detectHazards(sf, [sfZone, laZone, otherSfZone]);
    expect(active).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// nearestHazard
// ---------------------------------------------------------------------------
describe('nearestHazard', () => {
  it('returns the nearest zone with its distance', () => {
    const result = nearestHazard(sf, [sfZone, laZone]);
    expect(result).not.toBeNull();
    expect(result.zone).toBe(sfZone);
    expect(result.distanceKm).toBeCloseTo(0, 1);
  });

  it('returns null when zones array is empty', () => {
    expect(nearestHazard(sf, [])).toBeNull();
  });

  it('returns null when zones is not an array', () => {
    expect(nearestHazard(sf, null)).toBeNull();
  });

  it('returns null when zones are all malformed', () => {
    expect(nearestHazard(sf, [{ type: 'bad' }, null])).toBeNull();
  });

  it('distance is positive when location is not at zone centre', () => {
    const result = nearestHazard(sf, [laZone]);
    expect(result.distanceKm).toBeGreaterThan(0);
  });
});
