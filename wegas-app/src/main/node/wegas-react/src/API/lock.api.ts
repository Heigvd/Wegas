import { GameModel, Team, Player, Game } from '../data/selectors';
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
            ? GameModel != null
              ? GameModel.selectCurrent().id!
              : CurrentGM.id!
            : gameModelId
        }/Game/${
          gameId === undefined
            ? Game != null
              ? Game.selectCurrent().id!
              : CurrentGame.id!
            : gameId
        }/Team/${
          teamId === undefined
            ? Team != null
              ? Team.selectCurrent().id!
              : CurrentTeamId
            : teamId
        }/Player/${
          playerId === undefined
            ? Player != null
              ? Player.selectCurrent().id!
              : CurrentPlayerId
            : playerId
        }/Locks`,
      );
    },
  };
};

export const LockAPI = LockAPIFactory();
