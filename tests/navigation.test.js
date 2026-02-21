import { describe, it, expect } from '@jest/globals';
import {
  isValidCoordinate,
  generateRoute,
  generateRandomisedRoute,
  haversineDistanceKm,
  routeDistanceKm,
} from '../src/navigation/index.js';

// ---------------------------------------------------------------------------
// isValidCoordinate
// ---------------------------------------------------------------------------
describe('isValidCoordinate', () => {
  it('returns true for valid coordinates', () => {
    expect(isValidCoordinate({ lat: 37.7749, lng: -122.4194 })).toBe(true);
    expect(isValidCoordinate({ lat: 0, lng: 0 })).toBe(true);
    expect(isValidCoordinate({ lat: -90, lng: -180 })).toBe(true);
    expect(isValidCoordinate({ lat: 90, lng: 180 })).toBe(true);
  });

  it('returns false for out-of-range values', () => {
    expect(isValidCoordinate({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidCoordinate({ lat: 0, lng: 181 })).toBe(false);
    expect(isValidCoordinate({ lat: -91, lng: 0 })).toBe(false);
    expect(isValidCoordinate({ lat: 0, lng: -181 })).toBe(false);
  });

  it('returns false for non-numeric or missing fields', () => {
    expect(isValidCoordinate({ lat: 'a', lng: 0 })).toBe(false);
    expect(isValidCoordinate({ lat: 0 })).toBe(false);
    expect(isValidCoordinate(null)).toBe(false);
    expect(isValidCoordinate(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateRoute
// ---------------------------------------------------------------------------
describe('generateRoute', () => {
  const sf = { lat: 37.7749, lng: -122.4194 };
  const la = { lat: 34.0522, lng: -118.2437 };

  it('returns a direct route with origin and destination as waypoints', () => {
    const route = generateRoute(sf, la);
    expect(route.type).toBe('direct');
    expect(route.origin).toBe(sf);
    expect(route.destination).toBe(la);
    expect(route.waypoints).toEqual([sf, la]);
  });

  it('throws when origin is invalid', () => {
    expect(() => generateRoute({ lat: 999, lng: 0 }, la)).toThrow('Invalid origin coordinate');
  });

  it('throws when destination is invalid', () => {
    expect(() => generateRoute(sf, { lat: 0, lng: 999 })).toThrow(
      'Invalid destination coordinate',
    );
  });
});

// ---------------------------------------------------------------------------
// generateRandomisedRoute
// ---------------------------------------------------------------------------
describe('generateRandomisedRoute', () => {
  const sf = { lat: 37.7749, lng: -122.4194 };
  const la = { lat: 34.0522, lng: -118.2437 };
  const fresno = { lat: 36.7378, lng: -119.7871 };

  it('returns a direct route when the waypoint pool is empty', () => {
    const route = generateRandomisedRoute(sf, la, []);
    expect(route.type).toBe('direct');
    expect(route.waypoints).toEqual([sf, la]);
  });

  it('returns a randomised route with one intermediate waypoint', () => {
    const route = generateRandomisedRoute(sf, la, [fresno]);
    expect(route.type).toBe('randomised');
    expect(route.waypoints).toHaveLength(3);
    expect(route.waypoints[0]).toBe(sf);
    expect(route.waypoints[2]).toBe(la);
    expect(route.waypoints[1]).toBe(fresno);
  });

  it('filters out invalid waypoints from the pool', () => {
    const bad = { lat: 999, lng: 0 };
    const route = generateRandomisedRoute(sf, la, [bad]);
    expect(route.type).toBe('direct');
  });

  it('throws when origin is invalid', () => {
    expect(() => generateRandomisedRoute({ lat: 999, lng: 0 }, la)).toThrow(
      'Invalid origin coordinate',
    );
  });

  it('throws when destination is invalid', () => {
    expect(() => generateRandomisedRoute(sf, { lat: 0, lng: 999 })).toThrow(
      'Invalid destination coordinate',
    );
  });
});

// ---------------------------------------------------------------------------
// haversineDistanceKm
// ---------------------------------------------------------------------------
describe('haversineDistanceKm', () => {
  it('returns 0 for the same coordinate', () => {
    const point = { lat: 48.8566, lng: 2.3522 };
    expect(haversineDistanceKm(point, point)).toBeCloseTo(0, 5);
  });

  it('calculates a known distance accurately (SF → LA ≈ 559 km)', () => {
    const sf = { lat: 37.7749, lng: -122.4194 };
    const la = { lat: 34.0522, lng: -118.2437 };
    const dist = haversineDistanceKm(sf, la);
    expect(dist).toBeGreaterThan(550);
    expect(dist).toBeLessThan(570);
  });
});

// ---------------------------------------------------------------------------
// routeDistanceKm
// ---------------------------------------------------------------------------
describe('routeDistanceKm', () => {
  const sf = { lat: 37.7749, lng: -122.4194 };
  const fresno = { lat: 36.7378, lng: -119.7871 };
  const la = { lat: 34.0522, lng: -118.2437 };

  it('returns 0 for a route with a single waypoint', () => {
    expect(routeDistanceKm({ waypoints: [sf] })).toBe(0);
  });

  it('sums distances across all waypoints', () => {
    const direct = routeDistanceKm({ waypoints: [sf, la] });
    const viaFresno = routeDistanceKm({ waypoints: [sf, fresno, la] });
    // Indirect route must be longer than direct
    expect(viaFresno).toBeGreaterThan(direct);
  });
});
