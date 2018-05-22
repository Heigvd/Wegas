import { store } from '../store';

/**
 * Get the current GameModel
 *
 * @export
 * @returns {Readonly<IGameModel>}
 */
export function selectCurrent() {
  const state = store.getState();
  return state.gameModels[state.global.currentGameModelId];
}
