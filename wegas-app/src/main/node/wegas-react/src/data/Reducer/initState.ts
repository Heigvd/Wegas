import u from 'immer';
import { Reducer } from 'redux';
import { StateActions } from '../actions';
import { ActionType } from '../actionTypes';

export type InitStateKey =
  | 'variables'
  | 'instances'
  | 'pages'
  | 'game'
  | 'gameModel'
  | 'teams'
  | 'clientScriptsEvaluationDone';

/**
 * Inidicated if slices have been fully initialized
 */
export type InitState = Record<InitStateKey, boolean>;

/**
 * Reducer for Players
 */
const initStatuses: Reducer<Readonly<InitState>> = u(
  (state: InitState, action: StateActions) => {
    switch (action.type) {
      case ActionType.INIT_STATE_SET: {
        return {
          ...state,
          [action.payload.key]: action.payload.status,
        };
      }
    }
    return state;
  },
  {
    instances: false,
    variables: false,
    pages: false,
    game: false,
    gameModel: false,
    teams: false,
    languages: false,
    clientScriptsEvaluationDone: false,
  },
);
export default initStatuses;
