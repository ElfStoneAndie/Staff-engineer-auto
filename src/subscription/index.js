/**
 * Subscription Management — Phase 2 Paid Tier Infrastructure
 *
 * Manages user subscriptions, tier assignments, and feature-flag evaluation
 * for the Staff Engineer Auto paid tier.
 */

/** @type {'free'|'premium'} */
export const TIER_FREE = 'free';
/** @type {'free'|'premium'} */
export const TIER_PREMIUM = 'premium';

/**
 * @typedef {'free'|'premium'} Tier
 * @typedef {{ userId: string, tier: Tier, createdAt: string, cancelledAt: string|null }} Subscription
 */

/** In-memory store — replace with persistent backend in production. */
const subscriptions = new Map();

/** Feature flags keyed by tier. */
const FEATURE_FLAGS = {
  [TIER_FREE]: new Set(['navigation', 'basic_tts', 'hazard_detection']),
  [TIER_PREMIUM]: new Set([
    'navigation',
    'basic_tts',
    'hazard_detection',
    'premium_voices',
    'realtime_hazards',
    'multi_device_sync',
  ]),
};

/**
 * Creates a new subscription for the given user.
 *
 * @param {string} userId - Unique user identifier
 * @param {Tier} tier - Subscription tier ('free' or 'premium')
 * @returns {Subscription} The newly created subscription record
 * @throws {Error} When userId is missing or tier is unrecognised
 */
export function createSubscription(userId, tier) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('A valid userId string is required');
  }
  if (tier !== TIER_FREE && tier !== TIER_PREMIUM) {
    throw new Error(`Unrecognised tier: ${tier}. Must be 'free' or 'premium'`);
  }
  const subscription = {
    userId,
    tier,
    createdAt: new Date().toISOString(),
    cancelledAt: null,
  };
  subscriptions.set(userId, subscription);
  return subscription;
}

/**
 * Retrieves the subscription record for a user.
 *
 * @param {string} userId - Unique user identifier
 * @returns {Subscription|null} The subscription record, or null if not found
 */
export function getSubscription(userId) {
  return subscriptions.get(userId) ?? null;
}

/**
 * Cancels a user's subscription by recording the cancellation timestamp.
 *
 * @param {string} userId - Unique user identifier
 * @returns {Subscription} The updated subscription record
 * @throws {Error} When the user has no active subscription
 */
export function cancelSubscription(userId) {
  const sub = subscriptions.get(userId);
  if (!sub) {
    throw new Error(`No subscription found for user: ${userId}`);
  }
  sub.cancelledAt = new Date().toISOString();
  return sub;
}

/**
 * Checks whether a named feature is enabled for the given user based on their
 * active subscription tier.
 *
 * @param {string} userId - Unique user identifier
 * @param {string} featureName - Feature identifier to check
 * @returns {boolean} True when the feature is available on the user's tier
 */
export function isFeatureEnabled(userId, featureName) {
  const sub = subscriptions.get(userId);
  const tier = sub && !sub.cancelledAt ? sub.tier : TIER_FREE;
  return FEATURE_FLAGS[tier]?.has(featureName) ?? false;
}
