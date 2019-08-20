import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { omit } from 'lodash-es';

export interface GameModelState {
  [id: string]: Readonly<IGameModel>;
}
/**
 * Reducer for GameModels
 */
const gameModels: Reducer<Readonly<GameModelState>> = u(
  (state: GameModelState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_MODE: {
        const gms = action.payload.updatedEntities.gameModels;
        const deletedKeys = Object.keys(
          action.payload.deletedEntities.gameModels,
        );
        return { ...omit(state, deletedKeys), ...gms };
      }
      case ActionType.GAMEMODEL_EDIT:
        state[action.payload.gameModelId] = action.payload.gameModel;
        return;
    }
    return state;
  },
  { [CurrentGM.id!]: CurrentGM },
);
export default gameModels;

/**
 * Edit GameModel
 * @param gameModel the new version of the game model
 * @param gameModelId the Id of the edited game model
 */
export function editGameModel(gameModel: IGameModel, gameModelId: string) {
  return ActionCreator.GAMEMODEL_EDIT({ gameModel, gameModelId });
}
