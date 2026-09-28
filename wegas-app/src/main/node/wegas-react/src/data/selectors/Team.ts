import { RootState, store } from '../../store/store';

/**
 * Get the team with id
 * @param id team's id
 */
export function select(id: number, state: RootState = store.getState()) {
  return state.teams.entities[id];
}

/**
 * Get the current team.
 *
 * Dual-use: called with no argument it reads the store synchronously
 * (imperative, non-React callers); passed to useAppSelector it receives the
 * state and acts as a reactive selector.
 */
export function selectCurrent(state: RootState = store.getState()) {
  return state.teams.entities[state.teams.currentTeamId];
}
