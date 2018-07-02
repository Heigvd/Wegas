import { store } from '../store';

export function selectCurrent() {
  const state = store.getState();
  return state.teams[state.global.currentTeamId];
}
