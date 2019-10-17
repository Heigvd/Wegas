import { rest } from './rest';

/*
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{s: /?}Game/{gameId : ([1-9][0-9]*)?}{s2: /?}Team
POST	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{s: /?}Game/{gameId : ([1-9][0-9]*)?}{s2: /?}Team
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{s: /?}Game/{gameId : ([1-9][0-9]*)?}{s2: /?}Team/{teamId : [1-9][0-9]*}
PUT	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{s: /?}Game/{gameId : ([1-9][0-9]*)?}{s2: /?}Team/{teamId : [1-9][0-9]*}
DELETE	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{s: /?}Game/{gameId : ([1-9][0-9]*)?}{s2: /?}Team/{teamId: [1-9][0-9]*}
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{s: /?}Game/{gameId : ([1-9][0-9]*)?}{s2: /?}Team/{teamId: [1-9][0-9]*}/Reset
*/

export const TEAM_BASE = (gameId: number) => `GameModel/Game/${gameId}/Team`;

export const TeamAPI = {
  /**
   * Get all team of a game
   * @param gameId the id of the game
   */
  getAll(gameId: number): Promise<ITeam[]> {
    return rest(TEAM_BASE(gameId)).then((res: Response) => {
      return res.json();
    });
  },
};
