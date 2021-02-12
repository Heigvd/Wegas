import { instantiate } from '../scriptable';
import { store, useStore } from '../Stores/store';

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

export function useCurrentPlayer() {
  return instantiate(useStore(selectCurrent));
}
