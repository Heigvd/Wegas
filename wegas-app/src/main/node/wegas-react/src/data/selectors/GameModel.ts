import { store, RootState } from '../../store/store';

/**
 * Get the current GameModel.
 *
 * Dual-use: called with no argument it reads the new store synchronously
 * (imperative, non-React callers); passed to useAppSelector it receives the
 * state and acts as a reactive selector.
 */
export function selectCurrent(state: RootState = store.getState()) {
  return state.gameModels.entities[state.gameModels.currentGameModelId];
}

/**
 * Get the gameModel with id
 * @param id gameModel's id
 */
export function select(id: number, state: RootState = store.getState()) {
  return state.gameModels.entities[id];
}
