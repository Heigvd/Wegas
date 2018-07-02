import { store } from '../store';

export function selectCurrent() {
  const state = store.getState();
  return state.games[state.global.currentGameId];
}
