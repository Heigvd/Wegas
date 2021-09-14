/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {
  IAbstractAccountWithId,
  IGameModelLanguageWithId,
  IGameModelWithId,
  IGameWithId,
  IJpaAccount,
  IJpaAccountWithId,
  IPermission,
  IPermissionWithId,
  IPlayerWithId,
  IRoleWithId,
  ITeam,
  ITeamWithId,
  ITokenWithId,
  IUserWithId,
} from 'wegas-ts-api';

export interface WegasErrorMessage {
  '@class': 'WegasErrorMessage';
  messageId: string | null | undefined;
  level: string | null | undefined;
  message: string | null | undefined;
}

export type WegasRuntimeException = WegasErrorMessage;

export interface OnlineUser {
  fullname: string;
  email: string;
  username: string;
  connectionDate: number;
  lastActivityDate: number;
  userId: number;
  mainAccountId: number;
  highestRole: 0 | 1 | 2 | 3 | 4;
  playerId: number;
}

export type HashMethod = 'PLAIN' | 'SHA_256' | 'SHA_512';

export type IAccountWithPerm = IAbstractAccountWithId & {
  permissions?: IPermissionWithId[];
};

export type IRoleWithPermissions = IRoleWithId & {
  permissions?: IPermissionWithId[];
};

export type IUserWithAccounts = IUserWithId & {
  accounts?: IAccountWithPerm[];
  permissions?: IPermissionWithId[];
  roles?: IRoleWithPermissions[];
};
export interface IJpaAuthentication {
  '@class': 'JpaAuthentication';
  mandatoryMethod: HashMethod;
  salt: string;
  optionalMethod?: HashMethod;
  newSalt?: string;
}

export interface IAaiAuthentication {
  '@class': 'AaiAuthentication';
}

export type IAuthenticationMethod = IAaiAuthentication | IJpaAuthentication;

export interface WithAtClass {
  '@class': string;
}

export type ITokenInfo = WithAtClass & {
  '@class': 'TokenInfo';
  accountId: number | undefined;
  token: string;
};

export interface IAaiConfigInfo {
  enabled: boolean;
  showButton: boolean;
  server: string;
  loginUrl: string;
}

export type IAuthenticationInformation = WithAtClass & {
  '@class': 'AuthenticationInformation';
  login: string;
  remember: boolean;
  agreed: boolean;
  hashes: string[];
};

export interface ILevelDescriptor {
  level: string;
  effectiveLevel: string;
}

export interface PlayerToGameModel {
  player: IPlayerWithId;
  team?: ITeamWithId;
  game?: IGameWithId;
  gameModel?: IGameModelWithId;
}

export interface PlayerToGameModelLoading {
  player: IPlayerWithId;
  team?: ITeamWithId | 'LOADING';
  game?: IGameWithId | 'LOADING';
  gameModel?: IGameModelWithId | 'LOADING';
}

export interface GameAndGameModel {
  game?: IGameWithId;
  gameModel?: IGameModelWithId | 'LOADING';
}

export interface GameModelVersion {
  name: string;
  path: string;
  dataLastModified: number;
}

export interface DeeplUsage {
  character_count: number;
  character_limit: number;
}

/**
 * build fetch options
 */
function getOptions({
  method,
  body,
  contentType,
}: {
  method?: string;
  body?: {} | string | FormData;
  contentType?: string;
}): RequestInit {
  let headers;
  if (contentType) {
    // do not set multipart/form-data by hand but let the
    // browser do it
    if (contentType != 'multipart/form-data') {
      headers = new Headers({
        'content-type': contentType,
      });
    }
  } else {
    headers = new Headers({
      'content-type': 'application/json',
    });
  }

  return {
    headers: headers,
    method: method || 'GET',
    body: body ? (body instanceof FormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  };
}

const sendJsonRequest = async <T>(
  method: string,
  path: string,
  body: string | {} | undefined,
  errorHandler: (error: {} | Error) => void,
): Promise<T> => {
  const res = await fetch(
    path,
    getOptions({
      method: method,
      body: body,
    }),
  );

  if (res.ok) {
    if (res.status != 204) {
      return res.json();
    } else {
      return new Promise<void>(resolve => resolve()) as unknown as Promise<T>;
    }
  } else {
    let error;
    try {
      error = await res.json();
    } catch (e) {
      error = new Error('Failure');
    }
    errorHandler(error);
    throw error;
  }
};

const sendFormRequest = async <T>(
  method: string,
  path: string,
  body: string | {} | undefined,
  errorHandler: (error: {} | Error) => void,
): Promise<T> => {
  const res = await fetch(
    path,
    getOptions({
      method: method,
      body: body,
      contentType: 'multipart/form-data',
    }),
  );

  if (res.ok) {
    if (res.status != 204) {
      return res.json();
    } else {
      return new Promise<void>(resolve => resolve()) as unknown as Promise<T>;
    }
  } else {
    let error;
    try {
      error = await res.json();
    } catch (e) {
      error = new Error('Failure');
    }
    errorHandler(error);
    throw error;
  }
};

const sendRawRequest = async (
  method: string,
  path: string,
  body: string | {} | undefined,
  errorHandler: (error: {} | Error) => void,
): Promise<string> => {
  const res = await fetch(
    path,
    getOptions({
      method: method,
      body: body,
    }),
  );

  if (res.ok) {
    if (res.status != 204) {
      return res.text();
    } else {
      return new Promise<void>(resolve => resolve()) as unknown as Promise<string>;
    }
  } else {
    let error;
    try {
      error = await res.text();
    } catch (e) {
      error = new Error('Failure');
    }
    errorHandler(error);
    throw error;
  }
};

/**
 * The Wegas Lobby REST client
 */
export const WegasLobbyRestClient = function (
  endpoint: string,
  errorHandler: (error: unknown) => void,
) {
  const baseUrl = endpoint.endsWith('/') ? endpoint.substring(0, endpoint.length - 1) : endpoint;
  return {
    Authentication: {
      loginAsGuest: () => {
        const path = `${baseUrl}/User/GuestLogin`;
        const body = {
          '@class': 'AuthenticationInformation',
          remember: true,
        };

        return sendJsonRequest<void>('POST', path, body, errorHandler);
      },
      getAaiConfig: () => {
        const path = 'rest/Extended/User/Account/AaiConfig';
        return sendJsonRequest<IAaiConfigInfo>('get', path, undefined, errorHandler);
      },
      requestEmailValidation: () => {
        const path = `${baseUrl}/User/RequestEmailValidation`;
        return sendJsonRequest<void>('get', path, undefined, errorHandler);
      },
      forgetPassword: (email: string) => {
        const path = `${baseUrl}/User/SendNewPassword`;
        const body = {
          '@class': 'AuthenticationInformation',
          login: email,
        };
        return sendJsonRequest<void>('POST', path, body, errorHandler);
      },
      getDefaultAuthenticationMethod: () => {
        const path = `${baseUrl}/User/DefaultAuthMethod`;
        return sendJsonRequest<IAuthenticationMethod>('GET', path, undefined, errorHandler);
      },
      signup: (account: IJpaAccount) => {
        const path = `${baseUrl}/User/Signup`;
        return sendJsonRequest<void>('POST', path, account, errorHandler);
      },
      getAuthMethod: (login: string) => {
        const path = `${baseUrl}/User/AuthMethod/${login}`;
        return sendJsonRequest<IAuthenticationMethod[]>('GET', path, undefined, errorHandler);
      },
      authenticate: (authInfo: IAuthenticationInformation) => {
        const path = `${baseUrl}/User/Authenticate`;
        return sendJsonRequest<IJpaAccountWithId>('POST', path, authInfo, errorHandler);
      },
      runAs: (accountId: number) => {
        const path = `${baseUrl}/User/Be/${accountId}`;
        return sendJsonRequest<void>('POST', path, undefined, errorHandler);
      },
      agree: (accountId: number) => {
        const path = `${baseUrl}/User/Account/SetAgreed/${accountId}`;
        return sendJsonRequest<IAbstractAccountWithId>('POST', path, undefined, errorHandler);
      },
      logout: () => {
        const path = `${baseUrl}/User/Logout`;
        return sendJsonRequest<void>('GET', path, undefined, errorHandler);
      },
    },
    common: {
      getPusherAppKey: () => {
        const path = `${baseUrl}/Pusher/ApplicationKey`;
        return sendJsonRequest<{ key: string; cluster: string }>(
          'GET',
          path,
          undefined,
          errorHandler,
        );
      },
    },
    AdminStuff: {
      getLoggerLevels: () => {
        const path = `${baseUrl}/Utils/GetLoggerLevels`;
        return sendJsonRequest<{ [loggetName: string]: ILevelDescriptor }>(
          'GET',
          path,
          undefined,
          errorHandler,
        );
      },
      setLoggerLevel: (loggerName: string, level: string) => {
        const path = `${baseUrl}/Utils/SetLoggerLevel/${loggerName}/${level}`;
        return sendRawRequest('GET', path, undefined, errorHandler);
      },
      requestClientReload: () => {
        const path = `${baseUrl}/Pusher/RequestClientReload`;
        return sendJsonRequest<void>('GET', path, undefined, errorHandler);
      },
      getBuildDetails: () => {
        const path = `${baseUrl}/Utils/build_details`;
        return sendRawRequest('GET', path, undefined, errorHandler);
      },
      getBranch: () => {
        const path = `${baseUrl}/Utils/branch`;
        return sendRawRequest('GET', path, undefined, errorHandler);
      },
      getPullRequestBranch: () => {
        const path = `${baseUrl}/Utils/pr_branch`;
        return sendRawRequest('GET', path, undefined, errorHandler);
      },
      getPullRequestNumber: () => {
        const path = `${baseUrl}/Utils/pr_number`;
        return sendJsonRequest('GET', path, undefined, errorHandler);
      },
      getDeeplUsage: () => {
        const path = `${baseUrl}/GameModel/I18n/Usage`;
        return sendJsonRequest<DeeplUsage>('GET', path, undefined, errorHandler);
      },
      clearEmCache: () => {
        const path = `${baseUrl}/Utils/EmCache`;
        return sendJsonRequest<void>('DELETE', path, undefined, errorHandler);
      },
      createEmptyModel: () => {
        const path = `${baseUrl}/Update/CreateEmptyModel`;
        return sendRawRequest('POST', path, undefined, errorHandler);
      },
    },
    PermissionController: {
      createPermissionForUser: (userId: number, permission: IPermission) => {
        const path = `${baseUrl}/User/Permission/${userId}`;
        return sendJsonRequest<IPermissionWithId>('POST', path, permission, errorHandler);
      },
      createPermissionForRole: (roleId: number, permission: IPermission) => {
        const path = `${baseUrl}/Role/Permission/${roleId}`;
        return sendJsonRequest<IPermissionWithId>('POST', path, permission, errorHandler);
      },
      updatePermission: (permission: IPermissionWithId) => {
        const path = `${baseUrl}/User/Permission`;
        return sendJsonRequest<IPermissionWithId>('PUT', path, permission, errorHandler);
      },
      deletePermission: (id: number) => {
        const path = `${baseUrl}/User/Permission/${id}`;
        return sendJsonRequest<IPermissionWithId>('DELETE', path, undefined, errorHandler);
      },
    },
    RoleController: {
      getRoles: () => {
        const path = `${baseUrl}/Role`;
        return sendJsonRequest<IRoleWithPermissions[]>('GET', path, undefined, errorHandler);
      },
      create: (name: string) => {
        const role = { '@class': 'Role', name: name };
        const path = `${baseUrl}/Role`;
        return sendJsonRequest<IRoleWithPermissions>('POST', path, role, errorHandler);
      },
      getMembers: (roleId: number) => {
        const path = `${baseUrl}/Shadow/User/FindUsersWithRole/${roleId}`;
        return sendJsonRequest<IUserWithAccounts[]>('GET', path, undefined, errorHandler);
      },
      deleteRole: (roleId: number) => {
        const path = `${baseUrl}/Role/${roleId}`;
        return sendJsonRequest<IRoleWithId>('DELETE', path, undefined, errorHandler);
      },
      shareGame: (gameId: number, roleId: number) => {
        const path = `${baseUrl}/Role/ShareGame/${gameId}/${roleId}`;
        return sendJsonRequest<IPermissionWithId>('POST', path, undefined, errorHandler);
      },
      unshareGame: (gameId: number, roleId: number) => {
        const path = `${baseUrl}/Role/ShareGame/${gameId}/${roleId}`;
        return sendJsonRequest<IPermissionWithId[]>('DELETE', path, undefined, errorHandler);
      },
      shareGameModel: (gameModelId: number, roleId: number, permissions: string[]) => {
        const path = `${baseUrl}/Role/ShareGameModel/${gameModelId}/${permissions.join(
          ',',
        )}/${roleId}`;
        return sendJsonRequest<IPermissionWithId>('POST', path, undefined, errorHandler);
      },
      unshareGameModel: (gameModelId: number, roleId: number) => {
        const path = `${baseUrl}/Role/ShareGameModel/${gameModelId}/${roleId}`;
        return sendJsonRequest<IPermissionWithId[]>('DELETE', path, undefined, errorHandler);
      },
    },
    UserController: {
      updateAccount: (account: IAbstractAccountWithId) => {
        const path = `${baseUrl}/Shadow/User/Account/${account.id}`;
        return sendJsonRequest<IAbstractAccountWithId>('PUT', path, account, errorHandler);
      },
      giveRole: (userId: number, roleId: number) => {
        const path = `${baseUrl}/Shadow/User/${userId}/Add/${roleId}`;
        return sendJsonRequest<IUserWithAccounts>('PUT', path, undefined, errorHandler);
      },
      removeRole: (userId: number, roleId: number) => {
        const path = `${baseUrl}/Shadow/User/${userId}/Remove/${roleId}`;
        return sendJsonRequest<IUserWithAccounts>('PUT', path, undefined, errorHandler);
      },
      getAllUsers: () => {
        const path = `${baseUrl}/Shadow/User`;
        return sendJsonRequest<IUserWithAccounts[]>('GET', path, undefined, errorHandler);
      },
      getUser: (userId: number) => {
        const path = `${baseUrl}/User/${userId}`;
        return sendJsonRequest<IUserWithAccounts>('GET', path, undefined, errorHandler);
      },
      getFullUser: (userId: number) => {
        const path = `${baseUrl}/Editor/User/${userId}`;
        return sendJsonRequest<IUserWithAccounts>('GET', path, undefined, errorHandler);
      },
      getUserByIds: (ids: number[]) => {
        const path = `${baseUrl}/User/ByIds`;
        return sendJsonRequest<IUserWithAccounts[]>('POST', path, ids, errorHandler);
      },
      getCurrentUser: () => {
        const path = `${baseUrl}/Editor/User/Current`;
        return sendJsonRequest<IUserWithAccounts>('GET', path, undefined, errorHandler);
      },
      getCurrentAccount: () => {
        const path = `${baseUrl}/User/Account/Current`;
        return sendJsonRequest<IAccountWithPerm>('GET', path, undefined, errorHandler);
      },
      autoComplete: (pattern: string, roles: string[]) => {
        const path = `${baseUrl}/User/AutoComplete/${pattern}`;
        return sendJsonRequest<IAccountWithPerm[]>(
          'POST',
          path,
          { rolesList: roles },
          errorHandler,
        );
      },
      autoCompleteFull: (pattern: string) => {
        const path = `${baseUrl}/Shadow/User/AutoComplete/${pattern}`;
        return sendJsonRequest<IAccountWithPerm[]>('GET', path, undefined, errorHandler);
      },
      shareGame: (gameId: number, accountId: number) => {
        const path = `${baseUrl}/User/ShareGame/${gameId}/${accountId}`;
        return sendJsonRequest<void>('POST', path, undefined, errorHandler);
      },
      unshareGame: (gameId: number, accountId: number) => {
        const path = `${baseUrl}/User/ShareGame/${gameId}/${accountId}`;
        return sendJsonRequest<void>('DELETE', path, undefined, errorHandler);
      },
      shareGameModel: (gameModelId: number, accountId: number, permissions: string[]) => {
        const path = `${baseUrl}/User/ShareGameModel/${gameModelId}/${permissions.join(
          ',',
        )}/${accountId}`;
        return sendJsonRequest<void>('POST', path, undefined, errorHandler);
      },
      unshareGameModel: (gameModelId: number, accountId: number) => {
        const path = `${baseUrl}/User/ShareGameModel/${gameModelId}/${accountId}`;
        return sendJsonRequest<void>('DELETE', path, undefined, errorHandler);
      },
    },
    Token: {
      getToken: (accountId: number | undefined, token: string) => {
        const tokenInfo: ITokenInfo = {
          '@class': 'TokenInfo',
          accountId: accountId,
          token: token,
        };
        const path = `${baseUrl}/Editor/User/Account/Token`;
        return sendJsonRequest<ITokenWithId>('POST', path, tokenInfo, errorHandler);
      },
      processToken: (token: ITokenWithId) => {
        const path = `${baseUrl}/User/Account/ProcessToken/${token.id}`;
        return sendJsonRequest<ITokenWithId>('PUT', path, undefined, errorHandler);
      },
      loginWithToken: (accountId: number | undefined, token: string) => {
        const tokenInfo: ITokenInfo = {
          '@class': 'TokenInfo',
          accountId: accountId,
          token: token,
        };
        const path = `${baseUrl}/User/AuthenticateWithToken`;
        return sendJsonRequest<IUserWithAccounts>('POST', path, tokenInfo, errorHandler);
      },
    },
    PlayerController: {
      getById: (id: number) => {
        const path = `${baseUrl}/GameModel/Game/Team/1/Player/${id}`;
        return sendJsonRequest<IPlayerWithId>('GET', path, undefined, errorHandler);
      },
      getByGameId: (id: number) => {
        const path = `${baseUrl}/GameModel/Game/Team/1/Player/ByGameId/${id}`;
        return sendJsonRequest<IPlayerWithId>('GET', path, undefined, errorHandler);
      },
      getPlayers: () => {
        const path = `${baseUrl}/User/Current/Players`;
        return sendJsonRequest<PlayerToGameModel[]>('GET', path, undefined, errorHandler);
      },
      retry: (playerId: number) => {
        const path = `${baseUrl}/GameModel/Game/Team/1/Player/${playerId}/RetryJoin`;
        return sendJsonRequest<IPlayerWithId>('POST', path, undefined, errorHandler);
      },
      leave: (playerId: number) => {
        const path = `${baseUrl}/GameModel/Game/Team/1/Player/${playerId}`;
        return sendJsonRequest<IPlayerWithId>('DELETE', path, undefined, errorHandler);
      },
    },
    TeamController: {
      getById: (id: number) => {
        const path = `${baseUrl}/GameModel/Game/Team/${id}`;
        return sendJsonRequest<ITeamWithId>('GET', path, undefined, errorHandler);
      },
      getEditorTeamById: (teamId: number) => {
        const path = `${baseUrl}/Editor/GameModel/Game/Team/${teamId}`;
        return sendJsonRequest<ITeamWithId>('GET', path, undefined, errorHandler);
      },
      createTeam: (gameId: number, team: ITeam) => {
        const path = `${baseUrl}/GameModel/Game/${gameId}/Team`;
        return sendJsonRequest<ITeamWithId>('POST', path, team, errorHandler);
      },
      joinTeam: (teamId: number) => {
        const path = `${baseUrl}/GameModel/Game/Team/${teamId}/Player`;
        return sendJsonRequest<ITeamWithId>('POST', path, undefined, errorHandler);
      },
      deleteTeam: (teamId: number) => {
        const path = `${baseUrl}/GameModel/Game/Team/${teamId}`;
        return sendJsonRequest<void>('DELETE', path, undefined, errorHandler);
      },
    },
    GameController: {
      create: (gameModelId: number, name: string) => {
        const game = {
          '@class': 'Game',
          name: name,
        };
        const path = `${baseUrl}/GameModel/Game/${gameModelId}`;
        return sendJsonRequest<IGameWithId>('POST', path, game, errorHandler);
      },
      getById: (id: number) => {
        const path = `${baseUrl}/GameModel/Game/${id}`;
        return sendJsonRequest<IGameWithId>('GET', path, undefined, errorHandler);
      },
      getByIds: (ids: number[]) => {
        const path = `${baseUrl}/GameModel/Game/ByIds/${ids}`;
        return sendJsonRequest<IGameWithId[]>('GET', path, undefined, errorHandler);
      },
      update: (game: IGameWithId) => {
        const path = `${baseUrl}/Lobby/GameModel/Game/${game.id}`;
        return sendJsonRequest<IGameWithId>('PUT', path, game, errorHandler);
      },
      findByToken: (token: string) => {
        const path = `${baseUrl}/GameModel/Game/FindByToken/${token}`;
        return sendJsonRequest<IGameWithId>('GET', path, undefined, errorHandler);
      },
      joinIndividually: (game: IGameWithId) => {
        const path = `${baseUrl}/GameModel/Game/${game.id!}/Player`;
        return sendJsonRequest<ITeamWithId>('POST', path, undefined, errorHandler);
      },
      getTeams: (gameId: number) => {
        const path = `${baseUrl}/GameModel/Game/${gameId}/Team`;
        return sendJsonRequest<ITeamWithId[]>('GET', path, undefined, errorHandler);
      },
      getGames: (status: IGameWithId['status']) => {
        const path = `${baseUrl}/Lobby/GameModel/Game/status/${status}`;
        return sendJsonRequest<(IGameWithId & { gameModel?: IGameModelWithId })[]>(
          'GET',
          path,
          undefined,
          errorHandler,
        );
      },
      changeStatus: (gameId: number, status: IGameWithId['status']) => {
        const path = `${baseUrl}/Lobby/GameModel/Game/${gameId}/status/${status}`;
        return sendJsonRequest<IGameWithId>('PUT', path, undefined, errorHandler);
      },
      findTrainers: (gameId: number) => {
        const path = `${baseUrl}/User/FindEditorsByInstance/g${gameId}`;
        return sendJsonRequest<IUserWithAccounts[]>('GET', path, undefined, errorHandler);
      },
    },
    GameModelController: {
      createScenario: (templateId: number, name: string) => {
        const path = `${baseUrl}/GameModel/${templateId}`;
        return sendJsonRequest<IGameModelWithId>(
          'POST',
          path,
          { '@class': 'GameModel', name },
          errorHandler,
        );
      },
      createModel: (templateId: number, name: string) => {
        const path = `${baseUrl}/GameModel/model/${templateId}`;
        return sendJsonRequest<IGameModelWithId>(
          'POST',
          path,
          { '@class': 'GameModel', name },
          errorHandler,
        );
      },
      inferModel: (gameModelIds: number[], name: string) => {
        const path = `${baseUrl}/GameModel/extractModel/${gameModelIds.join(',')}`;
        return sendJsonRequest<IGameModelWithId>(
          'POST',
          path,
          { '@class': 'GameModel', name },
          errorHandler,
        );
      },
      getById: (id: number) => {
        const path = `${baseUrl}/GameModel/${id}`;
        return sendJsonRequest<IGameModelWithId>('GET', path, undefined, errorHandler);
      },
      getByIds: (ids: number[]) => {
        const path = `${baseUrl}/GameModel/ByIds/${ids}`;
        return sendJsonRequest<IGameModelWithId[]>('GET', path, undefined, errorHandler);
      },
      update: (gameModel: IGameModelWithId) => {
        const path = `${baseUrl}/Lobby/GameModel/${gameModel.id}`;
        return sendJsonRequest<IGameModelWithId>('PUT', path, gameModel, errorHandler);
      },
      duplicate: (gameModelId: number) => {
        const path = `${baseUrl}/Lobby/GameModel/${gameModelId}/Duplicate`;
        return sendJsonRequest<IGameModelWithId>('POST', path, undefined, errorHandler);
      },
      updateLanguages: (langs: IGameModelLanguageWithId[]) => {
        const path = `${baseUrl}/GameModel/I18n/Langs`;
        return sendJsonRequest<IGameModelLanguageWithId[]>('PUT', path, langs, errorHandler);
      },
      getGameModels: (gmType: IGameModelWithId['type'], status: IGameModelWithId['status']) => {
        const path = `${baseUrl}/Lobby/GameModel/type/${gmType}/status/${status}`;
        return sendJsonRequest<IGameModelWithId[]>('GET', path, undefined, errorHandler);
      },
      changeStatus: (gmid: number, status: IGameModelWithId['status']) => {
        const path = `${baseUrl}/Lobby/GameModel/${gmid}/status/${status}`;
        return sendJsonRequest<IGameModelWithId>('PUT', path, undefined, errorHandler);
      },
      findScenarists: (gameModelId: number) => {
        const path = `${baseUrl}/User/FindUserPermissionByInstance/gm${gameModelId}`;
        return sendJsonRequest<IUserWithAccounts[]>('GET', path, undefined, errorHandler);
      },
      diffFromFile: (file: File, gameModelId: number) => {
        const path = `${baseUrl}/Lobby/GameModel/${gameModelId}/PatchDiff`;
        const fd = new FormData();
        fd.append('file', file);
        return sendFormRequest('PUT', path, fd, errorHandler);
      },
      patchFromFile: (file: File, gameModelId: number) => {
        const path = `${baseUrl}/Lobby/GameModel/${gameModelId}/Patch`;
        const fd = new FormData();
        fd.append('file', file);
        return sendFormRequest('PUT', path, fd, errorHandler);
      },
      uploadJSON: (file: File) => {
        const path = `${baseUrl}/Lobby/GameModel`;
        const fd = new FormData();
        fd.append('file', file);
        return sendFormRequest('POST', path, fd, errorHandler);
      },
      integrate: (modelId: number, scenarioId: number) => {
        const path = `${baseUrl}/GameModel/${modelId}/Integrate/${scenarioId}`;
        return sendJsonRequest<IGameModelWithId>('PUT', path, undefined, errorHandler);
      },
      release: (scenarioId: number) => {
        const path = `${baseUrl}/GameModel/Release/${scenarioId}`;
        return sendJsonRequest<IGameModelWithId>('GET', path, undefined, errorHandler);
      },
    },
    HistoryController: {
      getVersions: (gameModelId: number) => {
        const path = `${baseUrl}/GameModel/${gameModelId}/History`;
        return sendJsonRequest<GameModelVersion[]>('GET', path, undefined, errorHandler);
      },
      createVersion: (gameModelId: number) => {
        const path = `${baseUrl}/GameModel/${gameModelId}/History/CreateVersion`;
        return sendJsonRequest<void>('POST', path, undefined, errorHandler);
      },
      createNamedVersion: (gameModelId: number, name: string) => {
        const path = `${baseUrl}/GameModel/${gameModelId}/History/CreateVersion/${name}`;
        return sendJsonRequest<void>('POST', path, undefined, errorHandler);
      },
      deleteVersion: (gameModelId: number, versionPath: string) => {
        const path = `${baseUrl}/GameModel/${gameModelId}/History/${versionPath}`;
        return sendJsonRequest<void>('DELETE', path, undefined, errorHandler);
      },
      restoreVersion: (gameModelId: number, versionPath: string) => {
        const path = `${baseUrl}/GameModel/${gameModelId}/History/Restore/${versionPath}`;
        return sendJsonRequest<IGameModelWithId>('GET', path, undefined, errorHandler);
      },
    },
    Who: {
      getOnlineUsers: () => {
        const path = `${baseUrl}/Pusher/OnlineUser`;
        return sendJsonRequest<OnlineUser[]>('GET', path, undefined, errorHandler);
      },
      syncAndGetOnlineUsers: () => {
        const path = `${baseUrl}/Pusher/OnlineUser/Sync`;
        return sendJsonRequest<OnlineUser[]>('GET', path, undefined, errorHandler);
      },
      clearOnlineUsers: () => {
        const path = `${baseUrl}/Pusher/OnlineUser`;
        return sendJsonRequest<OnlineUser[]>('GET', path, undefined, errorHandler);
      },
    },
  };
};
