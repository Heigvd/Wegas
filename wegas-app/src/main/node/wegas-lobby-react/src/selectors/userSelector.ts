/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {
  IAbstractAccount,
  IAbstractAccountWithId,
  IPermissionWithId,
  IRoleWithId,
  IUser,
  IUserWithId,
} from 'wegas-ts-api';
import { customStateEquals, shallowEqual, useAppSelector } from '../store/hooks';
import { LoadingStatus, WegasLobbyState } from '../store/store';

export function getRolePermissions(state: WegasLobbyState, roleId: number): IPermissionWithId[] {
  return Object.values(state.users.permissions).filter(
    p => p.parentType === 'Role' && p.parentId === roleId,
  );
}

export function getUserPermissions(state: WegasLobbyState, userId: number): IPermissionWithId[] {
  return Object.values(state.users.permissions).filter(
    p => p.parentType === 'User' && p.parentId === userId,
  );
}

export const useCurrentUser = (): {
  currentUserId: number | undefined;
  currentUser: IUserWithId | null;
  currentAccount: IAbstractAccountWithId | null;
  status: WegasLobbyState['auth']['status'];
  isAdmin?: boolean;
  isModeler?: boolean;
  isScenarist?: boolean;
  isTrainer?: boolean;
} => {
  return useAppSelector(state => {
    const user =
      state.auth.currentUserId != null ? state.users.users[state.auth.currentUserId] : null;
    const account =
      state.auth.currentAccountId != null
        ? state.users.accounts[state.auth.currentAccountId]
        : null;

    return {
      currentUserId: state.auth.currentUserId || undefined,
      currentUser: user != null && user != 'LOADING' ? user.user : null,
      currentAccount: account || null,
      status: state.auth.status,
      isAdmin: state.auth.isAdmin,
      isModeler: state.auth.isModeler,
      isScenarist: state.auth.isScenarist,
      isTrainer: state.auth.isTrainer,
    };
  }, shallowEqual);
};

export const useAccount = (userId: number | null | undefined) => {
  return useAppSelector(state => {
    if (userId != null) {
      const user = state.users.users[userId];
      if (user === 'LOADING') {
        return 'LOADING';
      } else if (user != null) {
        if (user.mainAccount) {
          return state.users.accounts[user.mainAccount];
        }
      }
    }
    return undefined;
  });
};

export interface UserInfo {
  userId: number;
  accountId: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  comment: string;
  agreedTime: number;
  lastSeenAt: number;
}

export function buildUserInfo(user: IUser, account: IAbstractAccount): UserInfo {
  return {
    userId: user.id!,
    accountId: account.id!,
    username: account.username,
    firstname: account.firstname || '',
    lastname: account.lastname || '',
    email: account.email || `***@${account.emailDomain}`,
    comment: account.comment || '',
    agreedTime: account.agreedTime || 0,
    lastSeenAt: user.lastSeenAt || 0,
  };
}

export const useUserInfo = (users: IUser[]): UserInfo[] => {
  return useAppSelector(state => {
    return users.flatMap(u => {
      const user = state.users.users[u.id!];
      if (user != null && user != 'LOADING') {
        if (user.mainAccount) {
          const account = state.users.accounts[user.mainAccount];
          if (account != null && u.id != null && account.id != null) {
            return [buildUserInfo(u, account)];
          }
        }
      }
      return [];
    });
  }, customStateEquals);
};

export const useAccountsByUserIds = (userIds: number[]) => {
  return useAppSelector(state => {
    const result: {
      accounts: IAbstractAccount[];
      unknownUsers: number[];
    } = {
      accounts: [],
      unknownUsers: [],
    };

    userIds.forEach(uId => {
      const user = state.users.users[uId];
      if (user == null) {
        result.unknownUsers.push(uId);
      } else if (user != 'LOADING') {
        if (user.mainAccount) {
          result.accounts.push(state.users.accounts[user.mainAccount]);
        }
      }
      if (user != null && user != 'LOADING') {
        if (user.mainAccount) {
          return [state.users.accounts[user.mainAccount]];
        }
      }
      return [];
    });

    return result;
  }, customStateEquals);
};

export const useRoleMembers = (roleId: number): { status: LoadingStatus; users: IUserWithId[] } => {
  return useAppSelector(state => {
    const members = state.users.roleUsers[roleId];

    if (members == null) {
      return {
        status: 'NOT_INITIALIZED',
        users: [],
      };
    } else if (members === 'LOADING') {
      return {
        status: 'LOADING',
        users: [],
      };
    } else {
      const users = members.flatMap(userId => {
        const user = state.users.users[userId];
        if (user != null && user != 'LOADING') {
          return [user.user];
        } else {
          return [];
        }
      });

      return {
        status: 'READY',
        users: users,
      };
    }
  }, customStateEquals);
};

export const useUserRoles = (userId: number): { status: LoadingStatus; roles: IRoleWithId[] } => {
  return useAppSelector(state => {
    const roleIds = state.users.userRoles[userId];

    if (roleIds == null) {
      return {
        status: 'NOT_INITIALIZED',
        roles: [],
      };
    } else if (roleIds === 'LOADING') {
      return {
        status: 'LOADING',
        roles: [],
      };
    } else {
      const roles = roleIds.flatMap(roleId => {
        const role = state.users.roles[roleId];
        if (role != null) {
          return [role];
        } else {
          return [];
        }
      });

      return {
        status: 'READY',
        roles: roles,
      };
    }
  }, customStateEquals);
};

export const useUserPermissions = (userId: number) => {
  return useAppSelector(state => {
    return getUserPermissions(state, userId);
  }, shallowEqual);
};

export const useRolePermissions = (roleId: number) => {
  return useAppSelector(state => {
    return getRolePermissions(state, roleId);
  }, shallowEqual);
};
