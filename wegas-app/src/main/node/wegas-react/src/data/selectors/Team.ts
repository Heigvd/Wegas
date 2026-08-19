import { store } from '../Stores/store';
import { store as reduxStore } from '../../store/store';

/**
 * Get the team with id
 * @param id team's id
 */
export function select(id: number) {
  return reduxStore.getState().teams[id];
}

export function selectCurrent() {
  const currentTeamId = store.getState().global.currentTeamId;
  return reduxStore.getState().teams[currentTeamId];
}
