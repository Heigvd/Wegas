import { selectCurrentGame } from '../store/slices/game';
import { selectCurrentGameModel } from '../store/slices/gameModel';
import { selectCurrentPlayer } from '../store/slices/players';
import { selectCurrentTeam } from '../store/slices/teams';
import { rest } from './rest';
/*
GET     /Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/{gameId : ([1-9][0-9]*)?}{sep2: /?}Team/{teamId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/Locks
GET     /Wegas/rest/Utils/Locks
*/

// "/Team/" + Y.Wegas.Facade.Game.get("currentTeamId") + "/Player/" + Y.Wegas.Facade.Game.get("currentPlayerId") + "/Locks"

export const LockAPIFactory = (gameModelId?: number) => {
  return {
    /**
     * get default page
     */
    getLocks(
      gameId?: number,
      teamId?: number,
      playerId?: number,
    ): Promise<unknown> {
      return rest(
        `/GameModel/${
          gameModelId === undefined
            ? selectCurrentGameModel != null
              ? selectCurrentGameModel().id!
              : CurrentGM.id!
            : gameModelId
        }/Game/${
          gameId === undefined
            ? selectCurrentGame != null
              ? selectCurrentGame().id!
              : CurrentGame.id!
            : gameId
        }/Team/${
          teamId === undefined
            ? selectCurrentTeam != null
              ? selectCurrentTeam().id!
              : CurrentTeamId
            : teamId
        }/Player/${
          playerId === undefined
            ? selectCurrentPlayer != null
              ? selectCurrentPlayer().id!
              : CurrentPlayerId
            : playerId
        }/Locks`,
      );
    },
  };
};

export const LockAPI = LockAPIFactory();
