import { store } from '../Stores/store';

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
