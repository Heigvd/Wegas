import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { omit } from 'lodash-es';
import { IGameModel, IGameModelLanguage } from 'wegas-ts-api/typings/WegasEntities';

export interface GameModelState {
  [id: string]: Readonly<IGameModel>;
}
/**
 * Reducer for GameModels
 */
const gameModels: Reducer<Readonly<GameModelState>> = u(
  (state: GameModelState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_RESPONSE_ACTION: {
        const gms = action.payload.updatedEntities.gameModels;
        const deletedKeys = Object.keys(
          action.payload.deletedEntities.gameModels,
        );
        return { ...omit(state, deletedKeys), ...gms };
      }
      case ActionType.GAMEMODEL_EDIT:
        state[action.payload.gameModelId] = action.payload.gameModel;
        return;
      case ActionType.LANGUAGE_EDIT: {
        const newLanguages = state[action.payload.gameModelId].languages;
        const langIndex = newLanguages.findIndex(
          language => language.code === action.payload.gameModelLanguage.code,
        );
        if (langIndex > -1) {
          newLanguages.splice(langIndex, 1, action.payload.gameModelLanguage);
          state[action.payload.gameModelId] = {
            ...state[action.payload.gameModelId],
            languages: newLanguages,
          };
        }
        return;
      }
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

/**
 * Edit GameModelLanguage
 * @param gameModelLanguage the new version of the game model language
 * @param gameModelId the Id of the edited game model
 */
export function editLanguage(
  gameModelLanguage: IGameModelLanguage,
  gameModelId: string,
) {
  return ActionCreator.LANGUAGE_EDIT({ gameModelLanguage, gameModelId });
}
