import { beforeEach, describe, it, expect } from '@jest/globals';
import {
  createSubscription,
  getSubscription,
  cancelSubscription,
  isFeatureEnabled,
  TIER_FREE,
  TIER_PREMIUM,
} from '../src/subscription/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let testUserId;
beforeEach(() => {
  // Use a unique ID per test to avoid cross-test contamination of the in-memory store
  testUserId = `user-${Math.random().toString(36).slice(2)}`;
});

// ---------------------------------------------------------------------------
// createSubscription
// ---------------------------------------------------------------------------
describe('createSubscription', () => {
  it('creates a free-tier subscription', () => {
    const sub = createSubscription(testUserId, TIER_FREE);
    expect(sub.userId).toBe(testUserId);
    expect(sub.tier).toBe(TIER_FREE);
    expect(sub.cancelledAt).toBeNull();
    expect(typeof sub.createdAt).toBe('string');
  });

  it('creates a premium-tier subscription', () => {
    const sub = createSubscription(testUserId, TIER_PREMIUM);
    expect(sub.tier).toBe(TIER_PREMIUM);
  });

  it('throws when userId is missing', () => {
    expect(() => createSubscription('', TIER_FREE)).toThrow('A valid userId string is required');
  });

  it('throws when userId is not a string', () => {
    expect(() => createSubscription(null, TIER_FREE)).toThrow('A valid userId string is required');
  });

  it('throws for an unrecognised tier', () => {
    expect(() => createSubscription(testUserId, 'enterprise')).toThrow(
      "Unrecognised tier: enterprise. Must be 'free' or 'premium'",
    );
  });
});

// ---------------------------------------------------------------------------
// getSubscription
// ---------------------------------------------------------------------------
describe('getSubscription', () => {
  it('returns the subscription after creation', () => {
    createSubscription(testUserId, TIER_FREE);
    const sub = getSubscription(testUserId);
    expect(sub).not.toBeNull();
    expect(sub.userId).toBe(testUserId);
  });

  it('returns null for an unknown user', () => {
    expect(getSubscription('unknown-user-xyz')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// cancelSubscription
// ---------------------------------------------------------------------------
describe('cancelSubscription', () => {
  it('sets cancelledAt to a date string', () => {
    createSubscription(testUserId, TIER_PREMIUM);
    const sub = cancelSubscription(testUserId);
    expect(typeof sub.cancelledAt).toBe('string');
  });

  it('throws when no subscription exists for the user', () => {
    expect(() => cancelSubscription('no-such-user')).toThrow(
      'No subscription found for user: no-such-user',
    );
  });
});

// ---------------------------------------------------------------------------
// isFeatureEnabled
// ---------------------------------------------------------------------------
describe('isFeatureEnabled', () => {
  it('allows free-tier features for a free user', () => {
    createSubscription(testUserId, TIER_FREE);
    expect(isFeatureEnabled(testUserId, 'navigation')).toBe(true);
    expect(isFeatureEnabled(testUserId, 'basic_tts')).toBe(true);
  });

  it('denies premium features for a free user', () => {
    createSubscription(testUserId, TIER_FREE);
    expect(isFeatureEnabled(testUserId, 'premium_voices')).toBe(false);
    expect(isFeatureEnabled(testUserId, 'realtime_hazards')).toBe(false);
  });

  it('allows premium features for a premium user', () => {
    createSubscription(testUserId, TIER_PREMIUM);
    expect(isFeatureEnabled(testUserId, 'premium_voices')).toBe(true);
    expect(isFeatureEnabled(testUserId, 'multi_device_sync')).toBe(true);
  });

  it('falls back to free tier after subscription is cancelled', () => {
    createSubscription(testUserId, TIER_PREMIUM);
    cancelSubscription(testUserId);
    expect(isFeatureEnabled(testUserId, 'premium_voices')).toBe(false);
  });

  it('returns false for an unknown feature', () => {
    createSubscription(testUserId, TIER_PREMIUM);
    expect(isFeatureEnabled(testUserId, 'nonexistent_feature')).toBe(false);
  });

  it('returns false for a user with no subscription', () => {
    expect(isFeatureEnabled('no-sub-user', 'premium_voices')).toBe(false);
  });
});
