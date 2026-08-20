import { ITeam } from 'wegas-ts-api';
import { TeamAPI } from '../../API/teams.api';
import { manageResponseHandler } from '../actions';
import { editingStore } from '../Stores/editingStore';
import { store, ThunkResult } from '../Stores/store';

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
