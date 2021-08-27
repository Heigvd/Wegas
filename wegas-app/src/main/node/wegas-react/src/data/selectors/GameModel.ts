import { store } from '../Stores/store';

/**
 * Get the current GameModel
 */
export function selectCurrent() {
  const state = store.getState();
  return state.gameModels[state.global.currentGameModelId];
}
/**
 * Get the gameModel with id
 * @param id gameModel's id
 */
export function select(id: number) {
  return store.getState().gameModels[id];
}
