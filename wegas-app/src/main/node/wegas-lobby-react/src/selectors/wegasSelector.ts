/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { isEqual, uniq } from 'lodash';
import { IGame, IGameModel, IGameModelWithId, IGameWithId, IPermission } from 'wegas-ts-api';
import { entityIs } from '../API/entityHelper';
import { PlayerToGameModelLoading } from '../API/restClient';
import { customStateEquals, shallowEqual, useAppSelector } from '../store/hooks';
import { WegasLobbyState } from '../store/store';
import { getRolePermissions, getUserPermissions } from './userSelector';

export const usePlayers = () => {
  return useAppSelector(
    state => {
      const players = Object.values(state.players.players);
      const pAndT: PlayerToGameModelLoading[] = players.map(p => {
        const t = p.parentId != null ? state.teams.teams[p.parentId] : undefined;
        const g = t != null && t.parentId != null ? state.games.games[t.parentId] : undefined;
        const gm =
          g != null && g != 'LOADING' && g.parentId != null
            ? state.gameModels.gameModels[g.parentId]
            : undefined;
        return {
          player: p,
          team: state.teams.teams[p.parentId!],
          game: g,
          gameModel: gm,
        };
      });

      return {
        status: state.players.status,
        players: pAndT,
      };
    },
    (a, b) => {
      if (a.status !== b.status) {
        return false;
      }
      if (a.players.length != b.players.length) {
        return false;
      }
      for (const i in a.players) {
        const aP = a.players[i];
        const bP = b.players[i];
        if (aP != null && bP != null) {
          if (aP.player != bP.player) {
            return false;
          }
          if (aP.team != bP.team) {
            return false;
          }
          if (aP.game != bP.game) {
            return false;
          }
          if (aP.gameModel != bP.gameModel) {
            return false;
          }
        } else if (aP != null || bP != null) {
          // one is null | undefined
          return false;
        }
      }

      return true;
    },
  );
};

export const useTeam = (teamId?: number) => {
  return useAppSelector(state => {
    if (teamId != null) {
      return state.teams.teams[teamId];
    } else {
      return undefined;
    }
  }, customStateEquals);
};

export const useTeams = (gameId?: number) => {
  return useAppSelector(state => {
    if (gameId != null) {
      const teamIds = state.games.teams[gameId];
      if (teamIds != null) {
        if (typeof teamIds !== 'string') {
          return teamIds.map(id => state.teams.teams[id]);
        }
        return 'LOADING';
      }
    }
    return 'UNSET';
  }, customStateEquals);
};

export const useGame = (gameId?: number) => {
  return useAppSelector(state => {
    if (gameId != null) {
      return state.games.games[gameId];
    } else {
      return undefined;
    }
  }, customStateEquals);
};

export const useGameModel = (gameModelId?: number) => {
  return useAppSelector(state => {
    if (gameModelId != null) {
      return state.gameModels.gameModels[gameModelId];
    } else {
      return undefined;
    }
  }, customStateEquals);
};

export type MINE_OR_ALL = 'MINE' | 'ALL';

export type PermissionType = 'None' | 'View' | 'Instantiate' | 'Translate' | 'Duplicate' | 'Edit';

export const useGameModelPermission = (gameModelId?: number, userId?: number): PermissionType => {
  return useAppSelector(state => {
    if (gameModelId != null && userId != null) {
      const perms = getUserTransitivePermissions(state, userId).flatMap(p => {
        const [permType, value, gmId] = p.value.split(':');
        if ((permType === 'GameModel' && gmId === '*') || gmId === `gm${gameModelId}`) {
          return value.split(',');
        }
        return [];
      });

      if (perms.indexOf('Edit') >= 0 || perms.indexOf('*') >= 0) {
        return 'Edit';
      } else if (perms.find(p => p.startsWith('Translate-')) != null) {
        return 'Translate';
      } else if (perms.indexOf('Duplicate') >= 0) {
        return 'Duplicate';
      } else if (perms.indexOf('Instantiate') >= 0) {
        return 'Instantiate';
      }
    }
    return 'None';
  });
};

function getUserTransitivePermissions(state: WegasLobbyState, userId: number): IPermission[] {
  const perms = [];
  const roles = state.users.userRoles[userId];
  perms.push(...getUserPermissions(state, userId));

  if (roles != null && roles != 'LOADING') {
    roles.forEach(rId => perms.push(...getRolePermissions(state, rId)));
  }
  return perms;
}

function getGames(
  state: WegasLobbyState,
  userId: number,
  mine: MINE_OR_ALL,
  permissionTypes: PermissionType[],
  gameStatus: IGameWithId['status'][],
) {
  let games: IGameWithId[] = [];
  const regex = new RegExp(`Game:(.*(${permissionTypes.join('|')}).*|\\*):(g\\d+|\\*)`);

  const sourcePermissions =
    mine === 'MINE'
      ? getUserPermissions(state, userId)
      : getUserTransitivePermissions(state, userId);

  const permissions = sourcePermissions.filter(p => p.value.match(regex));

  let wildcard = false;

  permissions.forEach(p => {
    const [, , gIdWithPrefix] = p.value.split(':');
    if (gIdWithPrefix === '*') {
      wildcard = true;
    } else {
      const gId = gIdWithPrefix.substring(1);
      if (gId.match(/\d+/)) {
        const game = state.games.games[+gId];
        if (entityIs(game, 'Game')) {
          games.push(game);
        }
      }
    }
  });

  if (wildcard) {
    games = Object.values(state.games.games).flatMap(gm => (entityIs(gm, 'Game') ? [gm] : []));
  } else {
    games = uniq(games);
  }

  return games.filter(gm => gameStatus.length === 0 || gameStatus.indexOf(gm.status) >= 0);
}

function getGameModels(
  state: WegasLobbyState,
  userId: number,
  mine: MINE_OR_ALL,
  permissionTypes: PermissionType[],
  gmType: IGameModelWithId['type'][],
  gmStatus: IGameModelWithId['status'][],
) {
  let gameModels: IGameModelWithId[] = [];
  const regex = new RegExp(`GameModel:(.*(${permissionTypes.join('|')}).*|\\*):(gm\\d+|\\*)`);

  const sourcePermissions =
    mine === 'MINE'
      ? getUserPermissions(state, userId)
      : getUserTransitivePermissions(state, userId);

  const permissions = sourcePermissions.filter(p => p.value.match(regex));

  let wildcard = false;

  permissions.forEach(p => {
    const [, , gmIdWithPrefix] = p.value.split(':');
    if (gmIdWithPrefix === '*') {
      wildcard = true;
    } else {
      const gmId = gmIdWithPrefix.substring(2);
      if (gmId.match(/\d+/)) {
        const gameModel = state.gameModels.gameModels[+gmId];
        if (entityIs(gameModel, 'GameModel')) {
          gameModels.push(gameModel);
        }
      }
    }
  });

  if (wildcard) {
    gameModels = Object.values(state.gameModels.gameModels).flatMap(gm =>
      entityIs(gm, 'GameModel') ? [gm] : [],
    );
  } else {
    gameModels = uniq(gameModels);
  }

  return gameModels.filter(
    gm =>
      (gmType.length === 0 || gmType.indexOf(gm.type) >= 0) &&
      (gmStatus.length === 0 || gmStatus.indexOf(gm.status) >= 0),
  );
}

export const useInstantiableGameModels = (userId: number | undefined) => {
  return useAppSelector(
    state => {
      if (userId != null) {
        const gameModels = getGameModels(
          state,
          userId,
          'ALL',
          ['Instantiate'],
          ['SCENARIO', 'MODEL'],
          ['LIVE'],
        );

        return {
          gamemodels: gameModels,
          status: state.gameModels.status,
        };
      }

      return {
        gamemodels: [],
        status: state.gameModels.status,
      };
    },
    (a, b) => {
      return shallowEqual(a.gamemodels, b.gamemodels) && isEqual(a.status, b.status);
    },
  );
};

export const useEditableGameModels = (
  userId: number | undefined,
  gameModelType: IGameModel['type'],
  gameModelStatus: IGameModel['status'],
  mine: MINE_OR_ALL,
) => {
  return useAppSelector(
    state => {
      if (userId != null) {
        return {
          gamemodels: getGameModels(
            state,
            userId,
            mine,
            ['Edit', 'Translate'],
            [gameModelType],
            [gameModelStatus],
          ),
          status: state.gameModels.status,
        };
      }

      return {
        gamemodels: [],
        status: state.gameModels.status,
      };
    },
    (a, b) => {
      return shallowEqual(a.gamemodels, b.gamemodels) && isEqual(a.status, b.status);
    },
  );
};

export const useDuplicatableGameModels = (userId: number | undefined) => {
  return useAppSelector(
    state => {
      if (userId != null) {
        const gameModels = getGameModels(
          state,
          userId,
          'ALL',
          ['Duplicate'],
          ['SCENARIO', 'MODEL'],
          ['LIVE'],
        );

        return {
          gamemodels: gameModels,
          status: state.gameModels.status,
        };
      }

      return {
        gamemodels: [],
        status: state.gameModels.status,
      };
    },
    (a, b) => {
      return shallowEqual(a.gamemodels, b.gamemodels) && isEqual(a.status, b.status);
    },
  );
};

export const useDuplicatableModels = (userId: number | undefined) => {
  return useAppSelector(
    state => {
      if (userId != null) {
        const gameModels = getGameModels(state, userId, 'ALL', ['Duplicate'], ['MODEL'], ['LIVE']);

        return {
          gamemodels: gameModels,
          status: state.gameModels.status,
        };
      }

      return {
        gamemodels: [],
        status: state.gameModels.status,
      };
    },
    (a, b) => {
      return shallowEqual(a.gamemodels, b.gamemodels) && isEqual(a.status, b.status);
    },
  );
};

export const useGames = (
  status: IGame['status'],
  userId: number | undefined,
  mine: MINE_OR_ALL,
) => {
  return useAppSelector(
    state => {
      const gStatus = state.games.status;

      if (userId != null) {
        const games = getGames(state, userId, mine, ['Edit'], [status]);

        // attach gameModel
        const gamesAndGameModels = games.flatMap(game => {
          const gameModel = state.gameModels.gameModels[game.parentId!];
          if (entityIs(gameModel, 'GameModel')) {
            // and make sure it's a PLAY one
            if (gameModel.type === 'PLAY') {
              return {
                gameModel: gameModel,
                game: game,
              };
            }
          }
          return [];
        });

        return {
          gamesAndGameModels: gamesAndGameModels,
          status: gStatus,
        };
      } else {
        return {
          gamesAndGameModels: [],
          status: gStatus,
        };
      }
    },
    (a, b) => {
      if (a.gamesAndGameModels.length != b.gamesAndGameModels.length) {
        return false;
      }
      if (!isEqual(a.status, b.status)) {
        return false;
      }
      for (const i in a.gamesAndGameModels) {
        const ai = a.gamesAndGameModels[i];
        const bi = b.gamesAndGameModels[i];
        if (ai.gameModel != bi.gameModel || ai.gameModel != bi.gameModel) {
          return false;
        }
      }

      return true;
    },
  );
};

export const useModelInstances = (userId: number | undefined, modelId: number) => {
  return useAppSelector(
    state => {
      if (userId != null) {
        const gameModels = getGameModels(
          state,
          userId,
          'ALL',
          ['View'],
          ['SCENARIO'],
          ['LIVE', 'BIN'],
        ).filter(gm => gm.basedOnId === modelId);

        return {
          gamemodels: gameModels,
          status: state.gameModels.status,
        };
      }

      return {
        gamemodels: [],
        status: state.gameModels.status,
      };
    },
    (a, b) => {
      return shallowEqual(a.gamemodels, b.gamemodels) && isEqual(a.status, b.status);
    },
  );
};

/**
 * Live scenario not linked to any model
 */
export const useIntegratableScenarios = (userId: number | undefined) => {
  return useAppSelector(
    state => {
      if (userId != null) {
        const gameModels = getGameModels(
          state,
          userId,
          'ALL',
          ['Edit'],
          ['SCENARIO'],
          ['LIVE'],
        ).filter(gm => gm.basedOnId == undefined);

        return {
          gamemodels: gameModels,
          status: state.gameModels.status,
        };
      }

      return {
        gamemodels: [],
        status: state.gameModels.status,
      };
    },
    (a, b) => {
      return shallowEqual(a.gamemodels, b.gamemodels) && isEqual(a.status, b.status);
    },
  );
};

export const useShareableGameModels = (userId: number | undefined) => {
  return useAppSelector(
    state => {
      if (userId != null) {
        const gameModels = getGameModels(
          state,
          userId,
          'ALL',
          ['Edit'],
          ['SCENARIO', 'MODEL'],
          ['LIVE', 'BIN', 'DELETE'],
        );

        return {
          gamemodels: gameModels,
          status: state.gameModels.status,
        };
      }

      return {
        gamemodels: [],
        status: state.gameModels.status,
      };
    },
    (a, b) => {
      return shallowEqual(a.gamemodels, b.gamemodels) && isEqual(a.status, b.status);
    },
  );
};

export const useShareableGames = (userId: number | undefined) => {
  return useAppSelector(
    state => {
      if (userId != null) {
        const games = getGames(state, userId, 'ALL', ['Edit'], ['LIVE', 'BIN', 'DELETE']);

        return {
          games: games,
          status: state.games.status,
        };
      }

      return {
        games: [],
        status: state.games.status,
      };
    },
    (a, b) => {
      return shallowEqual(a.games, b.games) && isEqual(a.status, b.status);
    },
  );
};

type PermissionObject =
  | {
      type: 'GameModel';
      id: number | undefined;
      gameModel: IGameModelWithId | 'LOADING' | undefined;
    }
  | {
      type: 'Game';
      id: number | undefined;
      game: IGameWithId | 'LOADING' | undefined;
    }
  | { type: 'WILDCARD' }
  | { type: 'DUMMY' };

export const usePermissionObject = (permissionId: string): PermissionObject => {
  return useAppSelector(state => {
    if (permissionId.startsWith('gm')) {
      const id = permissionId.substring(2);
      return {
        type: 'GameModel',
        id: +id || undefined,
        gameModel: state.gameModels.gameModels[+id],
      };
    } else if (permissionId.startsWith('g')) {
      const id = permissionId.substring(1);
      return {
        type: 'Game',
        id: +id || undefined,
        game: state.games.games[+id] || undefined,
      };
    } else if (permissionId === '*') {
      return {
        type: 'WILDCARD',
      };
    } else {
      return {
        type: 'DUMMY',
      };
    }
  });
};
