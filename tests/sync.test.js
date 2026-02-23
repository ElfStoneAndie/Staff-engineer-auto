import { describe, it, expect } from '@jest/globals';
import {
  syncState,
  getState,
  subscribeToStateChanges,
} from '../src/sync/index.js';

// Use unique user IDs per test to avoid cross-test state contamination
const uid = () => `user-${Math.random().toString(36).slice(2)}`;

// ---------------------------------------------------------------------------
// syncState
// ---------------------------------------------------------------------------
describe('syncState', () => {
  it('resolves without error for a valid userId and state', async () => {
    await expect(syncState(uid(), { route: 'A->B' })).resolves.toBeUndefined();
  });

  it('throws when userId is missing', async () => {
    await expect(syncState('', { route: 'A->B' })).rejects.toThrow(
      'A valid userId string is required',
    );
  });

  it('throws when userId is not a string', async () => {
    await expect(syncState(null, { route: 'A->B' })).rejects.toThrow(
      'A valid userId string is required',
    );
  });

  it('throws when state is not an object', async () => {
    await expect(syncState(uid(), 'not-an-object')).rejects.toThrow(
      'State must be a non-array object',
    );
  });

  it('throws when state is an array', async () => {
    await expect(syncState(uid(), [])).rejects.toThrow('State must be a non-array object');
  });

  it('notifies subscribers after a successful sync', async () => {
    const userId = uid();
    const received = [];
    subscribeToStateChanges(userId, (s) => received.push(s));
    await syncState(userId, { speed: 60 });
    expect(received).toHaveLength(1);
    expect(received[0].speed).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// getState
// ---------------------------------------------------------------------------
describe('getState', () => {
  it('returns null when no state has been synced', async () => {
    const result = await getState(uid());
    expect(result).toBeNull();
  });

  it('returns the last synced state', async () => {
    const userId = uid();
    await syncState(userId, { destination: 'Home' });
    const result = await getState(userId);
    expect(result).toEqual({ destination: 'Home' });
  });

  it('throws when userId is missing', async () => {
    await expect(getState('')).rejects.toThrow('A valid userId string is required');
  });

  it('returns a copy, not the internal reference', async () => {
    const userId = uid();
    const original = { x: 1 };
    await syncState(userId, original);
    const retrieved = await getState(userId);
    retrieved.x = 99;
    const again = await getState(userId);
    expect(again.x).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// subscribeToStateChanges
// ---------------------------------------------------------------------------
describe('subscribeToStateChanges', () => {
  it('throws when userId is missing', () => {
    expect(() => subscribeToStateChanges('', () => {})).toThrow(
      'A valid userId string is required',
    );
  });

  it('throws when callback is not a function', () => {
    expect(() => subscribeToStateChanges(uid(), 'not-a-function')).toThrow(
      'A callback function is required',
    );
  });

  it('returns a subscription handle with an unsubscribe method', () => {
    const handle = subscribeToStateChanges(uid(), () => {});
    expect(typeof handle.unsubscribe).toBe('function');
  });

  it('stops invoking callback after unsubscribe is called', async () => {
    const userId = uid();
    const received = [];
    const handle = subscribeToStateChanges(userId, (s) => received.push(s));
    await syncState(userId, { step: 1 });
    handle.unsubscribe();
    await syncState(userId, { step: 2 });
    expect(received).toHaveLength(1);
    expect(received[0].step).toBe(1);
  });

  it('supports multiple subscribers for the same user', async () => {
    const userId = uid();
    const a = [];
    const b = [];
    subscribeToStateChanges(userId, (s) => a.push(s));
    subscribeToStateChanges(userId, (s) => b.push(s));
    await syncState(userId, { ping: true });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
  });
});
