import { describe, it, expect } from '@jest/globals';
import {
  isInHazardZone,
  detectHazards,
  nearestHazard,
} from '../src/hazard_detection/index.js';

// Sample locations
const sf = { lat: 37.7749, lng: -122.4194 };
const la = { lat: 34.0522, lng: -118.2437 };

// Hazard zone centred on San Francisco, radius 10 km
const sfZone = { centre: sf, radiusKm: 10, name: 'SF Zone' };
// Hazard zone centred on Los Angeles, radius 10 km
const laZone = { centre: la, radiusKm: 10, name: 'LA Zone' };

// ---------------------------------------------------------------------------
// isInHazardZone
// ---------------------------------------------------------------------------
describe('isInHazardZone', () => {
  it('returns true when the location is the zone centre (distance = 0)', () => {
    expect(isInHazardZone(sf, sfZone)).toBe(true);
  });

  it('returns false when the location is well outside the zone', () => {
    expect(isInHazardZone(la, sfZone)).toBe(false);
  });

  it('returns true for a location just inside the radius', () => {
    // ~0.001° lat offset ≈ ~0.11 km — well within 10 km radius
    const nearby = { lat: sf.lat + 0.001, lng: sf.lng };
    expect(isInHazardZone(nearby, sfZone)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// detectHazards
// ---------------------------------------------------------------------------
describe('detectHazards', () => {
  it('returns an empty array when no zones match', () => {
    const result = detectHazards(sf, [laZone]);
    expect(result).toHaveLength(0);
  });

  it('returns matching zones when the location is inside them', () => {
    const result = detectHazards(sf, [sfZone, laZone]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(sfZone);
  });

  it('returns all matching zones when the location overlaps multiple zones', () => {
    const wideZone = { centre: la, radiusKm: 600, name: 'Wide Zone' };
    const result = detectHazards(sf, [sfZone, wideZone]);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// nearestHazard
// ---------------------------------------------------------------------------
describe('nearestHazard', () => {
  it('returns null for an empty zones array', () => {
    expect(nearestHazard(sf, [])).toBeNull();
  });

  it('returns null for a null zones argument', () => {
    expect(nearestHazard(sf, null)).toBeNull();
  });

  it('returns the single zone when only one exists', () => {
    const result = nearestHazard(sf, [sfZone]);
    expect(result.zone).toBe(sfZone);
    expect(result.distanceKm).toBeCloseTo(0, 5);
  });

  it('returns the nearest zone when multiple zones exist', () => {
    const result = nearestHazard(sf, [sfZone, laZone]);
    expect(result.zone).toBe(sfZone);
    expect(result.distanceKm).toBeLessThan(1);
  });
});
