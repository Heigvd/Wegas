import u from 'immer';
import { omit } from 'lodash-es';
import { Reducer } from 'redux';
import { ITeam } from 'wegas-ts-api';
import { TeamAPI } from '../../API/teams.api';
import { ActionCreator, manageResponseHandler, StateActions } from '../actions';
import { ActionType } from '../actionTypes';
import { editingStore } from '../Stores/editingStore';
import { store, ThunkResult } from '../Stores/store';

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
  (CurrentGame.teams || {}).reduce((prev, t) => {
    prev[t.id!] = t;
    return prev;
  }, {} as TeamState),
);
export default teams;

/**
 * Get all teams
 */
export function getTeams(): ThunkResult {
  return function () {
    const gameId = store.getState().global.currentGameId;
    return TeamAPI.getAll(gameId).then(res => {
      return store.dispatch(ActionCreator.TEAM_FETCH_ALL({ teams: res }));
    });
  };
}

/**
 * update a team
 */
export function updateTeam(team: ITeam): ThunkResult {
  return function () {
    const gameModelId = store.getState().global.currentGameModelId;
    const gameId = store.getState().global.currentGameId;
    return TeamAPI.update(gameModelId, gameId, team).then(res => {
      return editingStore.dispatch(manageResponseHandler(res));
    });
  };
}
