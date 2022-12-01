import { store } from '../Stores/store';

/**
 * Get the team with id
 * @param id team's id
 */
export function select(id: number) {
  const state = store.getState();
  return state.teams[id];
}

export function selectCurrent() {
  const state = store.getState();
  return state.teams[state.global.currentTeamId];
}
