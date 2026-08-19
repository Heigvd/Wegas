import { ITeam } from 'wegas-ts-api';
import { TeamAPI } from '../../API/teams.api';
import { manageResponseHandler } from '../actions';
import { editingStore } from '../Stores/editingStore';
import { store, ThunkResult } from '../Stores/store';
import { dispatch } from '../../store/store';
import { setInitStatus } from '../../store/slices/initStatus';
import { playersFromTeams, updatePlayers } from '../../store/slices/players';
import { setTeams } from '../../store/slices/teams';

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
        dispatch(setTeams([res]));
        dispatch(updatePlayers({ updated: playersFromTeams([res]) }));
        dispatch(setInitStatus({ key: 'teams', status: true }));
      });
    } else {
      // we fetch all the teams in the game
      return TeamAPI.getAll(gameId).then(res => {
        dispatch(setTeams(res));
        dispatch(updatePlayers({ updated: playersFromTeams(res) }));
        dispatch(setInitStatus({ key: 'teams', status: true }));
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
