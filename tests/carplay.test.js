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
    const route = { waypoints: [sf, la], type: 'direct' };
    const result = validateRouteForCarPlay(route);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid when route is null', () => {
    const result = validateRouteForCarPlay(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Route must be an object');
  });

  it('returns invalid when waypoints array is empty', () => {
    const result = validateRouteForCarPlay({ waypoints: [], type: 'direct' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('waypoint'))).toBe(true);
  });

  it('returns invalid when type is missing', () => {
    const result = validateRouteForCarPlay({ waypoints: [sf] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('type'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildCarPlayScreen
// ---------------------------------------------------------------------------
describe('buildCarPlayScreen', () => {
  it('builds a screen with default title', () => {
    const route = { waypoints: [sf, la], type: 'direct' };
    const screen = buildCarPlayScreen(route);
    expect(screen.title).toBe('Navigation');
    expect(screen.items).toHaveLength(2);
    expect(screen.interactive).toBe(false);
  });

  it('accepts a custom title', () => {
    const route = { waypoints: [sf], type: 'direct' };
    const screen = buildCarPlayScreen(route, 'Route Overview');
    expect(screen.title).toBe('Route Overview');
  });

  it('caps items at 12 waypoints', () => {
    const waypoints = Array.from({ length: 20 }, (_, i) => ({ lat: i, lng: i }));
    const route = { waypoints, type: 'direct' };
    const screen = buildCarPlayScreen(route);
    expect(screen.items).toHaveLength(12);
  });

  it('throws for an invalid route', () => {
    expect(() => buildCarPlayScreen(null)).toThrow('Invalid route for CarPlay');
  });

  it('includes formatted coordinates in item labels', () => {
    const route = { waypoints: [sf], type: 'direct' };
    const screen = buildCarPlayScreen(route);
    expect(screen.items[0].label).toContain('lat 37.7749');
    expect(screen.items[0].label).toContain('lng -122.4194');
  });
});

// ---------------------------------------------------------------------------
// validateUserFlow
// ---------------------------------------------------------------------------
describe('validateUserFlow', () => {
  it('returns valid for a flow within the step limit', () => {
    const result = validateUserFlow(['select destination', 'confirm route', 'start']);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid when flow exceeds 3 steps', () => {
    const result = validateUserFlow(['a', 'b', 'c', 'd']);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('exceeds'))).toBe(true);
  });

  it('returns invalid when steps is not an array', () => {
    const result = validateUserFlow('not an array');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Steps must be an array');
  });

  it('returns invalid when a step is an empty string', () => {
    const result = validateUserFlow(['start', '']);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('non-empty'))).toBe(true);
  });

  it('returns valid for an empty flow', () => {
    const result = validateUserFlow([]);
    expect(result.valid).toBe(true);
  });
});
