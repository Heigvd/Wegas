import { store } from '../store';

/**
 * Get the player with id
 * @param id player's id
 */
export function select(id: number) {
  const state = store.getState();
  return state.players[id];
}

export function selectCurrent() {
  const state = store.getState();
  return state.players[state.global.currentPlayerId];
}
