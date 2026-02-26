import { describe, it, expect } from '@jest/globals';
import {
  fetchLiveHazardZones,
  subscribeToHazardUpdates,
} from '../src/hazard_detection/realtime.js';

// ---------------------------------------------------------------------------
// fetchLiveHazardZones
// ---------------------------------------------------------------------------
describe('fetchLiveHazardZones', () => {
  const validBounds = { north: 38.0, south: 37.5, east: -122.0, west: -122.5 };

  it('throws when apiKey is missing', async () => {
    await expect(fetchLiveHazardZones('', validBounds)).rejects.toThrow(
      'A valid API key is required',
    );
  });

  it('throws when apiKey is not a string', async () => {
    await expect(fetchLiveHazardZones(null, validBounds)).rejects.toThrow(
      'A valid API key is required',
    );
  });

  it('throws when bounds are missing', async () => {
    await expect(fetchLiveHazardZones('key', null)).rejects.toThrow(
      'Bounds must include numeric north, south, east and west values',
    );
  });

  it('throws when bounds are incomplete', async () => {
    await expect(fetchLiveHazardZones('key', { north: 38.0 })).rejects.toThrow(
      'Bounds must include numeric north, south, east and west values',
    );
  });

  // TODO: add integration test once HTTP client is implemented
  it.todo('returns an array of hazard zones from the live API');
  it.todo('returns an empty array when no hazards are present in the bounding box');
});

// ---------------------------------------------------------------------------
// subscribeToHazardUpdates
// ---------------------------------------------------------------------------
describe('subscribeToHazardUpdates', () => {
  const sf = { lat: 37.7749, lng: -122.4194 };

  it('throws when location is missing', () => {
    expect(() => subscribeToHazardUpdates(null, () => {})).toThrow(
      'A valid location coordinate is required',
    );
  });

  it('throws when location coordinates are non-numeric', () => {
    expect(() => subscribeToHazardUpdates({ lat: 'a', lng: 'b' }, () => {})).toThrow(
      'A valid location coordinate is required',
    );
  });

  it('throws when callback is not a function', () => {
    expect(() => subscribeToHazardUpdates(sf, 'not-a-function')).toThrow(
      'A callback function is required',
    );
  });

  // TODO: add integration test once WebSocket/SSE transport is implemented
  it.todo('returns a subscription handle with an unsubscribe method');
  it.todo('invokes the callback with updated zones when hazard data changes');
});
