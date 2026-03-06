/**
 * Multi-Device State Sync — Phase 3 Multi-Agent Orchestration
 *
 * Provides real-time state synchronisation across web, desktop, and mobile
 * surfaces for the Staff Engineer Auto platform.
 */

/** In-memory state store — replace with persistent/real-time backend in production. */
const stateStore = new Map();

/** Listener registry keyed by userId; each entry holds a Set of callbacks. */
const listeners = new Map();

/**
 * Persists the navigation/session state for a user.
 * Notifies any active subscribers after the write completes.
 *
 * @param {string} userId - Unique user identifier
 * @param {object} state - Serialisable state snapshot to persist
 * @returns {Promise<void>}
 * @throws {Error} When userId is missing or state is not an object
 */
export async function syncState(userId, state) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('A valid userId string is required');
  }
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('State must be a non-array object');
  }
  // TODO: persist to real-time backend (e.g. Firebase, Supabase)
  stateStore.set(userId, { ...state });
  const userListeners = listeners.get(userId);
  if (userListeners) {
    for (const cb of userListeners) {
      cb({ ...state });
    }
  }
}

/**
 * Retrieves the most recently synced state for a user.
 *
 * @param {string} userId - Unique user identifier
 * @returns {Promise<object|null>} The last synced state snapshot, or null
 * @throws {Error} When userId is missing
 */
export async function getState(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('A valid userId string is required');
  }
  // TODO: read from real-time backend
  const stored = stateStore.get(userId);
  return stored ? { ...stored } : null;
}

/**
 * Subscribes to state changes for a given user.
 * The callback is invoked synchronously whenever `syncState` is called for
 * that user (useful for in-process tests; replace with WS/SSE in production).
 *
 * @param {string} userId - Unique user identifier
 * @param {Function} callback - Called with the new state snapshot on each change
 * @returns {{ unsubscribe: Function }} Handle; call `.unsubscribe()` to remove the listener
 * @throws {Error} When userId is missing or callback is not a function
 */
export function subscribeToStateChanges(userId, callback) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('A valid userId string is required');
  }
  if (typeof callback !== 'function') {
    throw new Error('A callback function is required');
  }
  if (!listeners.has(userId)) {
    listeners.set(userId, new Set());
  }
  listeners.get(userId).add(callback);

  return {
    unsubscribe() {
      const userListeners = listeners.get(userId);
      if (userListeners) {
        userListeners.delete(callback);
        if (userListeners.size === 0) {
          listeners.delete(userId);
        }
      }
    },
  };
}
