import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, Actions } from '../actions';
import { omit } from 'lodash-es';
// import normalizeData from '../normalize/index';

export interface GameModelState {
  [id: string]: Readonly<IGameModel>;
}
/**
 * Reducer for GameModels
 */
const gameModels: Reducer<Readonly<GameModelState>> = u<GameModelState>(
  (state: GameModelState, action: Actions) => {
    switch (action.type) {
      case ActionType.MANAGED_MODE:
        const gms = action.payload.updatedEntities.gameModels;
        const deletedKeys = Object.keys(
          action.payload.deletedEntities.gameModels,
        );
        return { ...omit(state, deletedKeys), ...gms };
    }
    return state;
  },
  { [CurrentGM.id]: CurrentGM },
);
export default gameModels;
