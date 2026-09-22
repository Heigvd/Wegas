import { store as oldStore } from '../Stores/store';
import { store } from '../../store/store';

/**
 * Get the team with id
 * @param id team's id
 */
export function select(id: number) {
  return store.getState().teams[id];
}

export function selectCurrent() {
  const currentTeamId = oldStore.getState().global.currentTeamId;
  return store.getState().teams[currentTeamId];
}
