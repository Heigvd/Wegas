import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions } from '../actions';
import { omit } from 'lodash-es';
// import normalizeData from '../normalize/index';

export interface GameState {
  [id: string]: Readonly<IGame>;
}
/**
 * Reducer for GameModels
 */
const games: Reducer<Readonly<GameState>> = u<GameState, [StateActions]>(
  (state: GameState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_MODE:
        const games = action.payload.updatedEntities.games;
        const deletedKeys = Object.keys(action.payload.deletedEntities.games);
        return { ...omit(state, deletedKeys), ...games };
    }
    return state;
  },
  { [CurrentGame.id!]: CurrentGame },
);
export default games;
