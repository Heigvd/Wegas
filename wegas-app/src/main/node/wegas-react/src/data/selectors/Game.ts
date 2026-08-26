import { store, RootState } from '../../store/store';

/**
 * Get the game with id
 * @param id game's id
 */
export function select(id: number, state: RootState = store.getState()) {
  return state.games.entities[id];
}

/**
 * Get the current game.
 *
 * Dual-use: called with no argument it reads the new store synchronously
 * (imperative, non-React callers); passed to useAppSelector it receives the
 * state and acts as a reactive selector.
 */
export function selectCurrent(state: RootState = store.getState()) {
  return state.games.entities[state.games.currentGameId];
}
