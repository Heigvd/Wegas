import { Reducer } from 'redux';
import u from 'updeep';
import { ActionType } from '../actions';
// import normalizeData from '../normalize/index';

export interface GameModelState {
  [id: string]: Readonly<IGameModel>;
}
/**
 * Reducer for GameModels
 *
 * @param {State} [state=u({}, { [CurrentGM.id]: CurrentGM })]
 * @param {Actions} action
 * @returns {Readonly<GameModelState>}
 */
const gameModels: Reducer<Readonly<GameModelState>> = function gameModel(
  state = u({}, { [CurrentGM.id]: CurrentGM }),
  action,
): Readonly<GameModelState> {
  switch (action.type) {
    case ActionType.MANAGED_MODE:
      const gms = action.payload.updatedEntities.gameModels;
      const deletedKeys = Object.keys(
        action.payload.deletedEntities.gameModels,
      );
      return u.omit(deletedKeys, u(gms, state));
  }
  return state;
};
export default gameModels;
