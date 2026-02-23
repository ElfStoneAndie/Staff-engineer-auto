import { describe, it, expect } from '@jest/globals';
import {
  validateRouteForCarPlay,
  buildCarPlayScreen,
  validateUserFlow,
} from '../src/carplay/index.js';

const sf = { lat: 37.7749, lng: -122.4194 };
const la = { lat: 34.0522, lng: -118.2437 };

// ---------------------------------------------------------------------------
// validateRouteForCarPlay
// ---------------------------------------------------------------------------
describe('validateRouteForCarPlay', () => {
  it('returns valid for a well-formed route', () => {
    const route = { origin: sf, destination: la, waypoints: [sf, la] };
    const result = validateRouteForCarPlay(route);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid when route is not an object', () => {
    const result = validateRouteForCarPlay(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('route must be an object');
  });

  it('returns an error when origin is missing', () => {
    const route = { destination: la, waypoints: [sf, la] };
    const result = validateRouteForCarPlay(route);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('origin'))).toBe(true);
  });

  it('returns an error when waypoints has fewer than 2 entries', () => {
    const route = { origin: sf, destination: la, waypoints: [sf] };
    const result = validateRouteForCarPlay(route);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('at least 2'))).toBe(true);
  });

  it('returns an error when waypoints exceeds 12 entries', () => {
    const manyWaypoints = Array.from({ length: 13 }, (_, i) => ({ lat: i, lng: i }));
    const route = { origin: sf, destination: la, waypoints: manyWaypoints };
    const result = validateRouteForCarPlay(route);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('12'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildCarPlayScreen
// ---------------------------------------------------------------------------
describe('buildCarPlayScreen', () => {
  it('builds a screen descriptor with correct structure', () => {
    const route = { origin: sf, destination: la, waypoints: [sf, la] };
    const screen = buildCarPlayScreen(route, 'My Trip');
    expect(screen.title).toBe('My Trip');
    expect(screen.interactive).toBe(false);
    expect(screen.items).toHaveLength(2);
    expect(screen.items[0].coordinate).toBe(sf);
    expect(screen.items[1].coordinate).toBe(la);
  });

  it('defaults title to "Navigation"', () => {
    const route = { origin: sf, destination: la, waypoints: [sf, la] };
    const screen = buildCarPlayScreen(route);
    expect(screen.title).toBe('Navigation');
  });

  it('caps items at 12 even when waypoints exceed 12', () => {
    const manyWaypoints = Array.from({ length: 15 }, (_, i) => ({ lat: i, lng: i }));
    const route = { origin: sf, destination: la, waypoints: manyWaypoints };
    const screen = buildCarPlayScreen(route);
    expect(screen.items).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// validateUserFlow
// ---------------------------------------------------------------------------
describe('validateUserFlow', () => {
  it('returns valid for a flow with 1–3 steps', () => {
    expect(validateUserFlow(['Step 1']).valid).toBe(true);
    expect(validateUserFlow(['Step 1', 'Step 2', 'Step 3']).valid).toBe(true);
  });

  it('returns invalid for a flow exceeding 3 steps', () => {
    const result = validateUserFlow(['A', 'B', 'C', 'D']);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('3'))).toBe(true);
  });

  it('returns invalid for an empty steps array', () => {
    const result = validateUserFlow([]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('at least one'))).toBe(true);
  });

  it('returns invalid when steps is not an array', () => {
    const result = validateUserFlow('not an array');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('steps must be an array');
  });
});
