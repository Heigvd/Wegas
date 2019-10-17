import { rest } from './rest';

/*
DELETE	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game
POST	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game
GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/FindByToken/{token : ([a-zA-Z0-9_-]|\.(?!\.))*}
POST	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/ShadowCreate
GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/status/{status: [A-Z]*}
GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/status/{status: [A-Z]*}/count
GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/{entityId : [1-9][0-9]*}
DELETE	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/{entityId: [1-9][0-9]*}
PUT	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/{entityId: [1-9][0-9]*}
PUT	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/{entityId: [1-9][0-9]*}/status/{status: [A-Z]*}
*/

export const GAME_BASE = `GameModel/Game/`;

export const GameAPI = {
  /**
   * Get a of the current gamemodel
   * @param gameId the id of the game
   */
  get(gameId: number): Promise<IGame> {
    return rest(GAME_BASE + String(gameId)).then((res: Response) => {
      return res.json();
    });
  },
};
