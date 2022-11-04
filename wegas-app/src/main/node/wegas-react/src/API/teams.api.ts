import { managedModeRequest, rest } from './rest';
import { IPlayer, ITeam } from 'wegas-ts-api';

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
  /**
   * Get all the emails from the players of the team
   * If no teamId is given then returns all the emails of the players in the game
   * @param gameId
   * @param teamId
   */
  getEmails(gameId: number, teamId?: number): Promise<string[]> {
    return rest(
      `/User/Emails/${gameId}${teamId != null ? '/' + teamId : ''}`,
    ).then((res: Response) => {
      return res.json();
    });
  },
  update(gameModelId: number, gameId: number, team: ITeam) {
    return managedModeRequest(
      `/GameModel/${gameModelId}/Game/${gameId}/Team/${team.id!}`,
      { method: 'PUT', body: JSON.stringify(team) },
    );
  },
  updatePlayer(gameModelId: number, gameId: number, teamId: number, player: IPlayer,) {
     return managedModeRequest(
      `/GameModel/${gameModelId}/Game/${gameId}/Team/${teamId!}/Player/${player.id}`,
      { method: 'PUT', body: JSON.stringify(player) },
    );
  }
};
