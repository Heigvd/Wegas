import { produce } from 'immer';
import { omit } from 'lodash-es';
import { Reducer } from 'redux';
import { IPlayer, ITeam } from 'wegas-ts-api';
import { TeamAPI } from '../../API/teams.api';
import { ActionCreator, manageResponseHandler, StateActions } from '../actions';
import { ActionType } from '../actionTypes';
import { editingStore } from '../Stores/editingStore';
import { store, ThunkResult } from '../Stores/store';
import { dispatch } from '../../store/store';
import { setInitStatus } from '../../store/slices/initStatus';
import { updatePlayers } from '../../store/slices/players';

// TODO Temporary until teams migration
function extractPlayers(teams: ITeam[]): Record<string, IPlayer> {
  return teams.reduce<Record<string, IPlayer>>((acc, t) => {
    t.players.forEach(p => {
      if (p.id !== undefined) {
        acc[p.id] = p;
      }
    });
    return acc;
  }, {});
}

export interface TeamState {
  [id: string]: Readonly<ITeam>;
}
/**
 * Reducer for Teams
 */
const teams: Reducer<Readonly<TeamState>> = produce(
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
  (CurrentGame.teams || {}).reduce<TeamState>((prev, t) => {
    prev[t.id!] = t;
    return prev;
  }, {}),
);
export default teams;

/**
 * Get all teams
 */
export function getTeams(): ThunkResult {
  return function () {
    const gameId = store.getState().global.currentGameId;

    if (APP_CONTEXT === 'Player') {
      // for a player, we fetch only the player's team
      const teamId = store.getState().global.currentTeamId;

      return TeamAPI.getTeam(gameId, teamId).then(res => {
        const result = store.dispatch(
          ActionCreator.TEAM_FETCH_ALL({ teams: [res] }),
        );
        dispatch(updatePlayers({ updated: extractPlayers([res]) }));
        dispatch(setInitStatus({ key: 'teams', status: true }));
        return result;
      });
    } else {
      // we fetch all the teams in the game
      return TeamAPI.getAll(gameId).then(res => {
        const result = store.dispatch(
          ActionCreator.TEAM_FETCH_ALL({ teams: res }),
        );
        dispatch(updatePlayers({ updated: extractPlayers(res) }));
        dispatch(setInitStatus({ key: 'teams', status: true }));
        return result;
      });
    }
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

/**
 * Change the player language
 */
export function changePlayerLanguage(codeLang: string): ThunkResult {
  return function () {
    const teamId: number = store.getState().global.currentTeamId;
    const playerId: number = store.getState().global.currentPlayerId;
    return TeamAPI.changePlayerLanguage(teamId, playerId, codeLang).then(
      res => {
        return store.dispatch(manageResponseHandler(res));
      },
    );
  };
}
