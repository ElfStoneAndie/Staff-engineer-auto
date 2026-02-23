import { describe, it, expect } from '@jest/globals';
import {
  CARPLAY_MAX_WAYPOINTS,
  CARPLAY_MAX_ROUTE_NAME_LENGTH,
  CARPLAY_MAX_STEPS,
  validateRouteForCarPlay,
} from '../src/carplay/index.js';

const sf = { lat: 37.7749, lng: -122.4194 };
const la = { lat: 34.0522, lng: -118.2437 };

// ---------------------------------------------------------------------------
// validateRouteForCarPlay — valid inputs
// ---------------------------------------------------------------------------
describe('validateRouteForCarPlay — valid routes', () => {
  it('accepts a minimal two-waypoint route', () => {
    const result = validateRouteForCarPlay({ waypoints: [sf, la] });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a route with a short name', () => {
    const result = validateRouteForCarPlay({ waypoints: [sf, la], name: 'SF to LA' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a route with steps within the limit', () => {
    const steps = Array.from({ length: CARPLAY_MAX_STEPS }, (_, i) => ({ instruction: `Step ${i}` }));
    const result = validateRouteForCarPlay({ waypoints: [sf, la], steps });
    expect(result.valid).toBe(true);
  });

  it('accepts a route with the maximum allowed waypoints', () => {
    const waypoints = Array.from({ length: CARPLAY_MAX_WAYPOINTS }, () => sf);
    const result = validateRouteForCarPlay({ waypoints });
    expect(result.valid).toBe(true);
  });

  it('accepts a route with a name exactly at the character limit', () => {
    const name = 'A'.repeat(CARPLAY_MAX_ROUTE_NAME_LENGTH);
    const result = validateRouteForCarPlay({ waypoints: [sf, la], name });
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateRouteForCarPlay — invalid inputs
// ---------------------------------------------------------------------------
describe('validateRouteForCarPlay — invalid routes', () => {
  it('rejects null input', () => {
    const result = validateRouteForCarPlay(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/waypoints array/);
  });

  it('rejects a route without a waypoints property', () => {
    const result = validateRouteForCarPlay({});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/waypoints array/);
  });

  it('rejects a route with only one waypoint', () => {
    const result = validateRouteForCarPlay({ waypoints: [sf] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/at least two waypoints/);
  });

  it('rejects a route with zero waypoints', () => {
    const result = validateRouteForCarPlay({ waypoints: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/at least two waypoints/);
  });

  it('rejects a route that exceeds the waypoint limit', () => {
    const waypoints = Array.from({ length: CARPLAY_MAX_WAYPOINTS + 1 }, () => sf);
    const result = validateRouteForCarPlay({ waypoints });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/maximum of 25 waypoints/);
  });

  it('rejects a route with a name that exceeds the character limit', () => {
    const name = 'A'.repeat(CARPLAY_MAX_ROUTE_NAME_LENGTH + 1);
    const result = validateRouteForCarPlay({ waypoints: [sf, la], name });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/maximum of 50 characters/);
  });

  it('rejects a route where name is not a string', () => {
    const result = validateRouteForCarPlay({ waypoints: [sf, la], name: 12345 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/name must be a string/);
  });

  it('rejects a route with steps exceeding the limit', () => {
    const steps = Array.from({ length: CARPLAY_MAX_STEPS + 1 }, () => ({}));
    const result = validateRouteForCarPlay({ waypoints: [sf, la], steps });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/maximum of 24 entries/);
  });

  it('rejects a route where steps is not an array', () => {
    const result = validateRouteForCarPlay({ waypoints: [sf, la], steps: 'many' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/steps must be an array/);
  });

  it('accumulates multiple errors', () => {
    const waypoints = Array.from({ length: CARPLAY_MAX_WAYPOINTS + 1 }, () => sf);
    const name = 'A'.repeat(CARPLAY_MAX_ROUTE_NAME_LENGTH + 1);
    const result = validateRouteForCarPlay({ waypoints, name });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('exposes correct constant values', () => {
    expect(CARPLAY_MAX_WAYPOINTS).toBe(25);
    expect(CARPLAY_MAX_ROUTE_NAME_LENGTH).toBe(50);
    expect(CARPLAY_MAX_STEPS).toBe(24);
  });
});
