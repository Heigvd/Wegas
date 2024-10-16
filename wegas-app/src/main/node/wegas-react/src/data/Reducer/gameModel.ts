import u from 'immer';
import { omit } from 'lodash-es';
import { Reducer } from 'redux';
import { IGameModel, IGameModelLanguage } from 'wegas-ts-api';
import { GameModelApi } from '../../API/gameModel.api';
import { ActionCreator, manageResponseHandler, StateActions } from '../actions';
import { ActionType } from '../actionTypes';
import { editingStore, EditingThunkResult } from '../Stores/editingStore';
import { ThunkResult } from '../Stores/store';

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
      case ActionType.GAMEMODEL_LANGUAGE_EDIT: {
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
  return ActionCreator.GAMEMODEL_LANGUAGE_EDIT({
    gameModelLanguage,
    gameModelId,
  });
}

export function liveEdition<T extends IMergeable>(
  channel: string,
  entity: T,
): EditingThunkResult {
  return function (dispatch, getState) {
    return GameModelApi.liveEdition(channel, entity).then(res =>
      editingStore.dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function createExtraTestPlayer(gameModelId: number): EditingThunkResult {
  return function (dispatch, getState) {
    return GameModelApi.createExtraTestPlayer(gameModelId).then(res =>
      editingStore.dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function getGameModel(gameModelId: number): ThunkResult {
  return function (dispatch) {
    return GameModelApi.get(gameModelId).then(res => {
      const result = editingStore.dispatch(manageResponseHandler(res));
      dispatch(ActionCreator.INIT_STATE_SET('gameModel', true));
      return result;
    });
  };
}
