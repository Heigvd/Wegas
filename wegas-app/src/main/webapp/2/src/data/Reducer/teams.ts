import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions, ActionCreator } from '../actions';
import { omit } from 'lodash-es';
import { ThunkResult, store } from '../Stores/store';
import { TeamAPI } from '../../API/teams.api';
import { ITeam } from 'wegas-ts-api';

export interface TeamState {
  [id: string]: Readonly<ITeam>;
}
/**
 * Reducer for Teams
 */
const teams: Reducer<Readonly<TeamState>> = u(
  (state: TeamState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_RESPONSE_ACTION: {
        const teams = action.payload.updatedEntities.teams;
        const deletedKeys = Object.keys(action.payload.deletedEntities.teams);
        return { ...omit(state, deletedKeys), ...teams };
      }
      case ActionType.TEAM_FETCH_ALL: {
        return action.payload.teams.reduce(
          (oldTeams, t) => t.id !== undefined && { ...oldTeams, [t.id]: t },
          {},
        );
      }
    }
    return state;
  },
  CurrentGame.teams.reduce((prev, t) => {
    prev[t.id!] = t;
    return prev;
  }, {} as TeamState),
);
export default teams;

/**
 * Get all teams
 * @param gameModel the new version of the game model
 */
export function getTeams(): ThunkResult {
  return function () {
    const gameId = store.getState().global.currentGameId;
    return TeamAPI.getAll(gameId).then(res => {
      return store.dispatch(ActionCreator.TEAM_FETCH_ALL({ teams: res }));
    });
  };
}
