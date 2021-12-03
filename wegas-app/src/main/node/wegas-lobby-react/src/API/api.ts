/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  IAbstractAccountWithId,
  IGameAdmin,
  IGameModelLanguageWithId,
  IGameModelWithId,
  IGameWithId,
  IJpaAccount,
  IJpaAccountWithId,
  IPermission,
  IPermissionWithId,
  IRoleWithId,
  ITeam,
  IUserWithId,
} from 'wegas-ts-api';
import getLogger from '../logger';
import { hashPassword } from '../SecurityHelper';
import { addNotification } from '../store/slices/notification';
import { getStore, WegasLobbyState } from '../store/store';
import { CHANNEL_PREFIX, getPusherClient, initPusherSocket } from '../websocket/websocket';
import { entityIs, entityIsException } from './entityHelper';
import {
  IAccountWithPerm,
  IAuthenticationInformation,
  IGameAdminWithTeams,
  IJpaAuthentication,
  IRoleWithPermissions,
  IUserWithAccounts,
  PlayerToGameModel,
  WegasLobbyRestClient,
} from './restClient';

const logger = getLogger('api');
//logger.setLevel(INFO);

const restClient = WegasLobbyRestClient(API_ENDPOINT, error => {
  if (entityIsException(error)) {
    getStore().dispatch(
      addNotification({
        status: 'OPEN',
        type: 'ERROR',
        message: error,
      }),
    );
  } else if (error instanceof Error) {
    getStore().dispatch(
      addNotification({
        status: 'OPEN',
        type: 'ERROR',
        message: `${error.name}: ${error.message}`,
      }),
    );
  } else {
    getStore().dispatch(
      addNotification({
        status: 'OPEN',
        type: 'ERROR',
        message: 'Something went wrong',
      }),
    );
  }
});

/**
 * First access to the API client.
 * Such direct allows direct calls to the API, bypassing thunk/redux action. It's not that normal.
 * to do such calls but may be usefull in some edge-cases whene using the redux state is useless.
 * EG. token processing
 */
export const getRestClient = (): typeof restClient => restClient;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Websocket Management
////////////////////////////////////////////////////////////////////////////////////////////////////

// Admin & Monitoring
////////////////////////////////////////////////////////////////////////////////////////////////////

export const getLoggerLevels = createAsyncThunk('admin/getLoggerLevels', async () => {
  return await restClient.AdminStuff.getLoggerLevels();
});

export const changeLoggerLevel = createAsyncThunk(
  'admin/setLoggerLevel',
  async (payload: { loggerName: string; loggerLevel: string }, thunkApi) => {
    await restClient.AdminStuff.setLoggerLevel(payload.loggerName, payload.loggerLevel);
    thunkApi.dispatch(getLoggerLevels());
    return payload;
  },
);

export const emptyGameBin = createAsyncThunk('admin/emptyGameBin', async () => {
  return await restClient.AdminStuff.emptyGameBin();
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Invoices
////////////////////////////////////////////////////////////////////////////////////////////////////

export const getAdminGames = createAsyncThunk(
  'invoices/getByType',
  async (gType: NonNullable<IGameAdmin['status']>) => {
    return await restClient.AdminStuff.Invoice.getGameAdmins(gType);
  },
);

export const getAdminGame = createAsyncThunk('invoices/get', async (id: number) => {
  return await restClient.AdminStuff.Invoice.getGameAdmin(id);
});

export const updateAdminGame = createAsyncThunk(
  'invoices/update',
  async (ga: IGameAdminWithTeams) => {
    return await restClient.AdminStuff.Invoice.updateGameAdmin(ga);
  },
);
export const deleteGameByGameAdmin = createAsyncThunk(
  'admin/deleteGameByGameAdmin',
  async (ga: IGameAdminWithTeams) => {
    return await restClient.AdminStuff.deleteGame(ga.id);
  },
);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Authentication
///////////////////////////////////////////////////////////////////////////////////////////////////

export const getAaiConfig = createAsyncThunk('auth/getAaiConfig', async () => {
  return await restClient.Authentication.getAaiConfig();
});

export const requestPasswordReset = createAsyncThunk(
  'auth/resetPassword',
  async (a: { email: string }) => {
    await restClient.Authentication.forgetPassword(a.email);
  },
);

async function signInJpa(a: { identifier: string; password: string; agreed?: boolean }) {
  // first, fetch an authenatication method
  const authMethods = await restClient.Authentication.getAuthMethod(a.identifier);
  const jpaMethods = authMethods.filter(
    method => method != null && method['@class'] === 'JpaAuthentication',
  );
  if (jpaMethods.length > 0) {
    const method = jpaMethods[0]! as IJpaAuthentication;

    const authInfo: IAuthenticationInformation = {
      '@class': 'AuthenticationInformation',
      login: a.identifier,
      remember: true,
      hashes: [],
      agreed: false,
    };

    authInfo.hashes.push(await hashPassword(method.mandatoryMethod, method.salt, a.password));
    if (method.optionalMethod != null && method.newSalt != null) {
      authInfo.hashes.push(await hashPassword(method.optionalMethod, method.newSalt, a.password));
    }

    await restClient.Authentication.authenticate(authInfo);
  }
}

export const signInAsGuest = createAsyncThunk(
  'auth/signInAsGuest',
  async (_payload: void, thunkApi) => {
    await restClient.Authentication.loginAsGuest();
    thunkApi.dispatch(reloadCurrentUser());
  },
);

export const signInWithToken = createAsyncThunk(
  'auth/signInWithToken',
  async (payload: { accountId: number; token: string }, thunkApi) => {
    await restClient.Token.loginWithToken(payload.accountId, payload.token);
    thunkApi.dispatch(reloadCurrentUser());
  },
);

export const signInWithJpaAccount = createAsyncThunk(
  'auth/signInJpaAccount',
  async (
    a: {
      identifier: string;
      password: string;
      agreed?: boolean;
    },
    thunkApi,
  ) => {
    await signInJpa(a);

    thunkApi.dispatch(reloadCurrentUser());
  },
);

export const signOut = createAsyncThunk('auth/signout', async () => {
  const client = getPusherClient();
  if (client != null) {
    logger.info('API Sign out');
    client.unbindAllChannels();
  }
  return await restClient.Authentication.logout();
});

export const signUp = createAsyncThunk(
  'auth/signup',
  async (
    a: {
      username: string;
      email: string;
      password: string;
      firstname: string;
      lastname: string;
      agreed: boolean;
    },
    thunkApi,
  ) => {
    // first, fetch an authentication method
    const method = await restClient.Authentication.getDefaultAuthenticationMethod();
    if (method['@class'] === 'JpaAuthentication') {
      const hash = await hashPassword(method.mandatoryMethod, method.salt, a.password);

      const signUpInfo: IJpaAccount = {
        '@class': 'JpaAccount',
        email: a.email,
        username: a.username,
        salt: method.salt,
        password: hash,
        firstname: a.firstname,
        lastname: a.lastname,
        agreedTime: a.agreed ? Date.now() : 0,
        comment: '',
      };
      await restClient.Authentication.signup(signUpInfo);

      await signInJpa({
        identifier: a.email,
        password: a.password,
        agreed: a.agreed,
      });

      thunkApi.dispatch(reloadCurrentUser());
    }
  },
);

export const agreePolicy = createAsyncThunk('user/agree', async (accountId: number) => {
  restClient.Authentication.agree(accountId);
});

export const reloadCurrentUser = createAsyncThunk(
  'auth/reload',
  async (
    _noPayload: void,
    thunkApi,
  ): Promise<{ currentUser: IUserWithAccounts; currentAccount: IAccountWithPerm }> => {
    // one would like to await both query result later, but as those requests are most likely
    // the very firsts to be sent to the server, it should be avoided to prevent creatiing two
    // session_id cookie
    const currentUser = await restClient.UserController.getCurrentUser();
    const currentAccount = await restClient.UserController.getCurrentAccount();

    const pusherClient = getPusherClient();
    const state = thunkApi.getState() as WegasLobbyState;
    logger.info(
      'API reload current user',
      pusherClient != null ? 'client ok' : 'client n/a',
      'user: ',
      currentUser,
      'user id: ',
      state.auth.currentUserId,
    );
    if (pusherClient != null && state.pusher.socketId) {
      if (currentUser != null && currentUser.id != null) {
        // current user is authenticated
        if (state.auth.currentUserId != currentUser.id) {
          if (currentUser.roles!.find(role => role.name === 'Administrator')) {
            pusherClient.bindChannel(CHANNEL_PREFIX.Admin);
          }
          // Websocket session is ready AND currentUser just changed
          // subscribe to the new current user channel ASAP
          pusherClient.bindChannel(CHANNEL_PREFIX.User(currentUser.id));

          currentUser.roles!.forEach(role => {
            pusherClient.bindChannel(CHANNEL_PREFIX.Role(role.name));
          });
        }
      } else {
        pusherClient.unbindAllChannels();
      }
    }

    return { currentUser: currentUser, currentAccount: currentAccount };
  },
);

export const getUser = createAsyncThunk(
  'user/get',
  async (userId: number): Promise<IUserWithId> => {
    return await restClient.UserController.getUser(userId);
  },
);

export const getFullUser = createAsyncThunk(
  'user/getFull',
  async (userId: number): Promise<IUserWithId> => {
    return await restClient.UserController.getFullUser(userId);
  },
);

export const getShadowUserByIds = createAsyncThunk('user/getByIds', async (ids: number[]) => {
  return await restClient.UserController.getUserByIds(ids);
});

export const updateAccount = createAsyncThunk(
  'account/updateJpa',
  async (account: IAbstractAccountWithId) => {
    return await restClient.UserController.updateAccount(account);
  },
);

export const deleteAccount = createAsyncThunk(
  'account/deleteAccount',
  async (account: IAbstractAccountWithId) => {
    return await restClient.UserController.deleteAccount(account);
  },
);

export const updateJpaPassword = createAsyncThunk(
  'account/updateJpa',
  async ({ account, password }: { account: IJpaAccountWithId; password: string }) => {
    const authMethods = await restClient.Authentication.getAuthMethod(account.email);
    const jpaMethods = authMethods.filter(
      method => method != null && method['@class'] === 'JpaAuthentication',
    );

    if (jpaMethods.length > 0) {
      const method = jpaMethods[0]! as IJpaAuthentication;
      const hash = await hashPassword(method.mandatoryMethod, method.salt, password);
      const jpaAccount: IJpaAccountWithId = { ...account, password: hash };
      return restClient.UserController.updateAccount(jpaAccount);
    } else {
      throw { '@class': 'WegasErrorMessage', messageId: 'IMPOSSIBLE-TO-UPDATE-PASSWORD' };
    }
  },
);

export const getAllUsers = createAsyncThunk(
  'user/getAll',
  async (): Promise<IUserWithAccounts[]> => {
    return await restClient.UserController.getAllUsers();
  },
);

export const getRoleMembers = createAsyncThunk(
  'role/getMembers',
  async (roleId: number): Promise<IUserWithAccounts[]> => {
    return await restClient.RoleController.getMembers(roleId);
  },
);

export const getAllRoles = createAsyncThunk(
  'roles/getAll',
  async (): Promise<IRoleWithPermissions[]> => {
    return await restClient.RoleController.getRoles();
  },
);

export const createRole = createAsyncThunk(
  'roles/create',
  async (name: string): Promise<IRoleWithPermissions> => {
    return await restClient.RoleController.create(name);
  },
);

export const deleteRole = createAsyncThunk(
  'roles/delete',
  async (id: number): Promise<IRoleWithId> => {
    return await restClient.RoleController.deleteRole(id);
  },
);

export const updateRole = createAsyncThunk(
  'roles/update',
  async (role: IRoleWithId): Promise<IRoleWithId> => {
    return await restClient.RoleController.updateRole(role);
  },
);

export const giveRoleToUser = createAsyncThunk(
  'roles/give',
  async (payload: { userId: number; roleId: number }) => {
    return await restClient.UserController.giveRole(payload.userId, payload.roleId);
  },
);

export const removeRoleFromUser = createAsyncThunk(
  'roles/kick',
  async (payload: { userId: number; roleId: number }) => {
    return await restClient.UserController.removeRole(payload.userId, payload.roleId);
  },
);

export const createPermissionForRole = createAsyncThunk(
  'permission/createForRole',
  async ({ id, permission }: { id: number; permission: IPermission }) => {
    return await restClient.PermissionController.createPermissionForRole(id, permission);
  },
);

export const createPermissionForUser = createAsyncThunk(
  'permission/createForUser',
  async ({ id, permission }: { id: number; permission: IPermission }) => {
    return await restClient.PermissionController.createPermissionForUser(id, permission);
  },
);

export const updatePermission = createAsyncThunk(
  'permission/update',
  async (permission: IPermissionWithId) => {
    return await restClient.PermissionController.updatePermission(permission);
  },
);

export const deletePermission = createAsyncThunk('permission/delete', async (id: number) => {
  return await restClient.PermissionController.deletePermission(id);
});

export const getPlayers = createAsyncThunk(
  'players/get',
  async (): Promise<PlayerToGameModel[]> => {
    return await restClient.PlayerController.getPlayers();
  },
);

export const runAs = createAsyncThunk('auth/runAs', async (accountId: number) => {
  return await restClient.Authentication.runAs(accountId);
});

export const getOnlineUsers = createAsyncThunk('who/get', async () => {
  return await restClient.Who.getOnlineUsers();
});

export const syncOnlineUsers = createAsyncThunk('who/sync', async () => {
  return await restClient.Who.syncAndGetOnlineUsers();
});

export const clearOnlineUsers = createAsyncThunk('who/clear', async () => {
  return await restClient.Who.clearOnlineUsers();
});

export const leaveGame = createAsyncThunk('player/leave', async (playerId: number) => {
  return restClient.PlayerController.leave(playerId);
});

export const kickTeam = createAsyncThunk('team/delete', async (teamId: number) => {
  return restClient.TeamController.deleteTeam(teamId);
});

export const getPusherConfig = createAsyncThunk('pusher/getConfig', async () => {
  return await restClient.common.getPusherAppKey();
});

export const initPusher = createAsyncThunk(
  'pusher/init',
  async (_payload, thunkApi): Promise<string> => {
    const state = thunkApi.getState() as WegasLobbyState;
    const { appId, cluster } = state.pusher;
    if (appId != null && cluster != null) {
      const socketId = initPusherSocket(appId, `${API_ENDPOINT}/Pusher/auth`, cluster).socketId;
      const pusherClient = getPusherClient();
      logger.info(
        'API init pusher',
        pusherClient != null ? 'ok' : 'n/a',
        ' user id: ',
        state.auth.currentUserId,
      );
      if (state.auth.currentUserId != null && pusherClient != null) {
        if (state.auth.isAdmin) {
          pusherClient.bindChannel(CHANNEL_PREFIX.Admin);
        }
        pusherClient.bindChannel(CHANNEL_PREFIX.User(state.auth.currentUserId));
        const roleIds = state.users.userRoles[state.auth.currentUserId];
        if (roleIds != null && roleIds != 'LOADING') {
          roleIds.forEach(rId => {
            const role = state.users.roles[rId];
            if (entityIs(role, 'Role')) {
              pusherClient.bindChannel(CHANNEL_PREFIX.Role(role.name));
            }
          });
        }
      }
      return socketId;
    } else {
      throw 'unknown config';
    }
  },
);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Player & Team API
////////////////////////////////////////////////////////////////////////////////////////////////////

export const findGameByToken = createAsyncThunk(
  'game/findByToken',
  async (
    token: string,
  ): Promise<{
    game: IGameWithId;
    gameModel: IGameModelWithId;
  }> => {
    const game = await restClient.GameController.findByToken(token);
    if (game != null && game.parentId != null) {
      const gameModel = await restClient.GameModelController.getById(game.parentId, 'Extended');
      return { game, gameModel };
    } else {
      throw 'GAME_NOT_FOUND';
    }
  },
);

export const getAllTeams = createAsyncThunk('game/getTeams', async (id: number) => {
  return await restClient.GameController.getTeams(id);
});

export const joinIndividually = createAsyncThunk('game/joinIndiv', async (game: IGameWithId) => {
  const team = await restClient.GameController.joinIndividually(game);
  if (team != null) {
    return game;
  } else {
    throw 'GAME_NOT_FOUND';
  }
});

export const createTeam = createAsyncThunk(
  'team/create',
  async ({ team, game }: { game: IGameWithId; team: ITeam }) => {
    return await restClient.TeamController.createTeam(game.id, team);
  },
);

export const joinTeam = createAsyncThunk('team/join', async (teamId: number) => {
  return await restClient.TeamController.joinTeam(teamId);
});

export const retryToJoinTeam = createAsyncThunk('team/retry', async (playerId: number) => {
  return await restClient.PlayerController.retry(playerId);
});

export const getPlayerById = createAsyncThunk('player/byId', async (id: number) => {
  return await restClient.PlayerController.getById(id);
});

export const getTeamById = createAsyncThunk('team/byId', async (id: number) => {
  return await restClient.TeamController.getById(id);
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Game API
////////////////////////////////////////////////////////////////////////////////////////////////////

export const createGame = createAsyncThunk(
  'game/create',
  async ({ templateId, name }: { templateId: number; name: string }) => {
    return await restClient.GameController.create(templateId, name);
  },
);

export const getGameById = createAsyncThunk(
  'game/byId',
  async ({ id, view }: { id: number; view: 'Lobby' | 'Extended' }) => {
    return await restClient.GameController.getById(id, view);
  },
);

export const getGameByIds = createAsyncThunk('game/byIds', async (ids: number[]) => {
  return await restClient.GameController.getByIds(ids);
});

export const getGameModelById = createAsyncThunk(
  'gameModel/byId',
  async ({ id, view }: { id: number; view: 'Lobby' | 'Extended' }) => {
    return await restClient.GameModelController.getById(id, view);
  },
);

export const getGameModelByIds = createAsyncThunk('gameModel/byIds', async (ids: number[]) => {
  return await restClient.GameModelController.getByIds(ids);
});

export const getGames = createAsyncThunk('game/getGames', async (status: IGameWithId['status']) => {
  return await restClient.GameController.getGames(status);
});

export const changeGameStatus = createAsyncThunk(
  'game/changeStatus',
  async ({ gameId, status }: { gameId: number; status: IGameWithId['status'] }) => {
    return await restClient.GameController.changeStatus(gameId, status);
  },
);

export const updateGame = createAsyncThunk('game/updateGame', async (game: IGameWithId) => {
  return await restClient.GameController.update(game);
});

export const shareGame = createAsyncThunk(
  'game/shareGame',
  async (payload: { gameId: number; accountId: number }) => {
    return await restClient.UserController.shareGame(payload.gameId, payload.accountId);
  },
);

export const unshareGame = createAsyncThunk(
  'game/unshareGame',
  async (payload: { gameId: number; accountId: number }) => {
    return await restClient.UserController.unshareGame(payload.gameId, payload.accountId);
  },
);

export const shareGameToRole = createAsyncThunk(
  'game/shareGameToRole',
  async (payload: { gameId: number; roleId: number }) => {
    return await restClient.RoleController.shareGame(payload.gameId, payload.roleId);
  },
);

export const unshareGameFromRole = createAsyncThunk(
  'game/unshareGameFromRole',
  async (payload: { gameId: number; roleId: number }) => {
    return await restClient.RoleController.unshareGame(payload.gameId, payload.roleId);
  },
);

////////////////////////////////////////////////////////////////////////////////////////////////////
// GameModel - Scenario API
////////////////////////////////////////////////////////////////////////////////////////////////////

export const createScenario = createAsyncThunk(
  'gameModel/createScenario',
  async ({ templateId, name }: { templateId: number; name: string }) => {
    return await restClient.GameModelController.createScenario(templateId, name);
  },
);

export const updateGameModel = createAsyncThunk(
  'gameModel/update',
  async (gameModel: IGameModelWithId) => {
    return await restClient.GameModelController.update(gameModel);
  },
);

export const updateLanguages = createAsyncThunk(
  'gameModel/updateLangs',
  async (langs: IGameModelLanguageWithId[]) => {
    return await restClient.GameModelController.updateLanguages(langs);
  },
);

export const getGameModels = createAsyncThunk(
  'gamemodel/getGameModels',
  async (payload: Pick<IGameModelWithId, 'status' | 'type'>) => {
    return await restClient.GameModelController.getGameModels(payload.type, payload.status);
  },
);

export const duplicateGameModel = createAsyncThunk(
  'gameModel/duplicate',
  async (gameModelId: number) => {
    return await restClient.GameModelController.duplicate(gameModelId);
  },
);

export const changeGameModelStatus = createAsyncThunk(
  'gameModel/changeStatus',
  async ({ gameModelId, status }: { gameModelId: number; status: IGameModelWithId['status'] }) => {
    return await restClient.GameModelController.changeStatus(gameModelId, status);
  },
);

export const shareGameModel = createAsyncThunk(
  'gameModel/share',
  async (payload: { gameModelId: number; accountId: number; permissions: string[] }) => {
    return await restClient.UserController.shareGameModel(
      payload.gameModelId,
      payload.accountId,
      payload.permissions,
    );
  },
);

export const unshareGameModel = createAsyncThunk(
  'gameModel/unshare',
  async (payload: { gameModelId: number; accountId: number }) => {
    return await restClient.UserController.unshareGameModel(payload.gameModelId, payload.accountId);
  },
);

export const shareGameModelToRole = createAsyncThunk(
  'gameModel/shareToRole',
  async (payload: { gameModelId: number; roleId: number; permissions: string[] }) => {
    return await restClient.RoleController.shareGameModel(
      payload.gameModelId,
      payload.roleId,
      payload.permissions,
    );
  },
);

export const unshareGameModelFromRole = createAsyncThunk(
  'gameModel/unshareRole',
  async (payload: { gameModelId: number; roleId: number }) => {
    return await restClient.RoleController.unshareGameModel(payload.gameModelId, payload.roleId);
  },
);

////////////////////////////////////////////////////////////////////////////////////////////////////
// GameModel - Model API
////////////////////////////////////////////////////////////////////////////////////////////////////
export const createModel = createAsyncThunk(
  'gameModel/model/create',
  async ({ templateId, name }: { templateId: number; name: string }) => {
    return await restClient.GameModelController.createModel(templateId, name);
  },
);

export const inferModel = createAsyncThunk(
  'gameModel/model/infer',
  async ({ gmIds, name }: { gmIds: number[]; name: string }) => {
    return await restClient.GameModelController.inferModel(gmIds, name);
  },
);

export const integrateScenario = createAsyncThunk(
  'gameModel/integrate',
  async ({ modelId, scenarioId }: { modelId: number; scenarioId: number }) => {
    return await restClient.GameModelController.integrate(modelId, scenarioId);
  },
);

export const releaseScenario = createAsyncThunk(
  'gameModel/integrate',
  async (scenarioId: number) => {
    return await restClient.GameModelController.release(scenarioId);
  },
);

////////////////////////////////////////////////////////////////////////////////////////////////////
// GameModel - Version API
////////////////////////////////////////////////////////////////////////////////////////////////////
export const getVersions = createAsyncThunk(
  'gameModel/version/getAll',
  async ({ gameModelId }: { gameModelId: number }) => {
    return await restClient.HistoryController.getVersions(gameModelId);
  },
);

export const createVersion = createAsyncThunk(
  'gameModel/version/create',
  async ({ gameModelId }: { gameModelId: number }) => {
    return await restClient.HistoryController.createVersion(gameModelId);
  },
);

export const createNamedVersion = createAsyncThunk(
  'gameModel/version/createNamed',
  async ({ gameModelId, name }: { gameModelId: number; name: string }) => {
    return await restClient.HistoryController.createNamedVersion(gameModelId, name);
  },
);

export const deleteVersion = createAsyncThunk(
  'gameModel/version/delete',
  async ({ gameModelId, name }: { gameModelId: number; name: string }) => {
    return await restClient.HistoryController.deleteVersion(gameModelId, name);
  },
);

export const restoreVersion = createAsyncThunk(
  'gameModel/version/restore',
  async ({ gameModelId, name }: { gameModelId: number; name: string }) => {
    return await restClient.HistoryController.restoreVersion(gameModelId, name);
  },
);

export const uploadJson = createAsyncThunk('gameModel/upload', async ({ file }: { file: File }) => {
  return await restClient.GameModelController.uploadJSON(file);
});
