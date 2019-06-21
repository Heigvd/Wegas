import { store } from '../store';

/**
 * Get the game with id
 * @param id game's id
 */
export function select(id: number) {
  const state = store.getState();
  return state.games[id];
}


export function selectCurrent() {
  const state = store.getState();
  return state.games[state.global.currentGameId];
}
