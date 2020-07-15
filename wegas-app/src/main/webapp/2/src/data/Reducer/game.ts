import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { omit } from 'lodash-es';
import { store, ThunkResult } from '../store';
import { GameAPI } from '../../API/games.api';
import { IGame } from 'wegas-ts-api/typings/WegasEntities';
// import normalizeData from '../normalize/index';

export interface GameState {
  [id: string]: Readonly<IGame>;
}
/**
 * Reducer for GameModels
 */
const games: Reducer<Readonly<GameState>> = u(
  (state: GameState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_RESPONSE_ACTION: {
        const games = action.payload.updatedEntities.games;
        const deletedKeys = Object.keys(action.payload.deletedEntities.games);
        return { ...omit(state, deletedKeys), ...games };
      }
      case ActionType.GAME_FETCH: {
        if (action.payload.game.id !== undefined) {
          state[action.payload.game.id] = action.payload.game;
        }
        break;
      }
    }
    return state;
  },
  { [CurrentGame.id!]: CurrentGame },
);
export default games;

/**
 * Get all teams
 * @param gameModel the new version of the game model
 */
export function getGame(): ThunkResult {
  return function() {
    const gameId = store.getState().global.currentGameId;
    return GameAPI.get(gameId).then(res => {
      return store.dispatch(ActionCreator.GAME_FETCH({ game: res }));
    });
  };
}
