import { store } from '../store';

/**
 * Get the current User.
 *
 * @export
 * @returns Current logged in user
 */
export function selectCurrentUser() {
  const state = store.getState();
  return state.global.currentUser;
}

/**
 * Get the current State.
 *
 * @export
 * @returns Current app state
 */
export function getState() {
  return store.getState();
}
