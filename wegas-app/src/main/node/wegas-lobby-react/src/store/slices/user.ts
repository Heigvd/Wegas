/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice } from '@reduxjs/toolkit';
import { IAbstractAccountWithId, IPermissionWithId, IRoleWithId, IUserWithId } from 'wegas-ts-api';
import * as API from '../../API/api';
import { IAccountWithPerm, IRoleWithPermissions, IUserWithAccounts } from '../../API/restClient';
import { mapById, removeItem } from '../../helper';
import { processDeletedEntities, processUpdatedEntities } from '../../websocket/websocket';
import { LoadingStatus } from '../store';

export interface UserDetail {
  user: IUserWithId;
  fullStatus: LoadingStatus;
  mainAccount: number | undefined;
  accounts: number[];
}

export interface UserState {
  users: Record<number, UserDetail | 'LOADING'>;
  accounts: Record<number, IAbstractAccountWithId>;
  roles: Record<number, IRoleWithId>;
  /** userId to list of role id*/
  userRoles: Record<number, number[] | 'LOADING'>;
  /** roleId to list of user id*/
  roleUsers: Record<number, number[] | 'LOADING'>;
  permissions: Record<number, IPermissionWithId>;
}

const initialState: UserState = {
  users: {},
  accounts: {},
  roles: {},
  userRoles: {},
  roleUsers: {},
  permissions: {},
};

//const updateUser = (state: UserState, user: IUser) => {
//  if (user.id != null) {
//    state.users[user.id] = user;
//  }
//};
//const removeUser = (state: UserState, userId: number) => {
//  delete state.users[userId];
//};
//const updateAccount = (state: UserState, account: IAbstractAccount) => {
//  if (account.id != null) {
//    state.accounts[account.id] = account;
//  }
//};
//const removeAccount = (state: UserState, accountId: number) => {
//  delete state.accounts[accountId];
//};

export function clearAccounts(user: IUserWithAccounts): IUserWithId {
  if (user.accounts) {
    delete user.accounts;
  }
  return user;
}

export function clearPermissions(account: IAccountWithPerm): IAbstractAccountWithId {
  if (account.permissions) {
    delete account.permissions;
  }
  return account;
}

function updatePermissions(state: UserState, withPerm: { permissions?: IPermissionWithId[] }) {
  if (withPerm.permissions != null) {
    state.permissions = { ...state.permissions, ...mapById(withPerm.permissions) };
  }
}

function deleteRole(state: UserState, role: IRoleWithId) {
  delete state.roles[role.id];
  delete state.roleUsers[role.id];
}

function updateRole(state: UserState, role: IRoleWithPermissions) {
  state.roles[role.id] = role;
  updatePermissions(state, role);
}

function updateUser(state: UserState, user: IUserWithAccounts) {
  if (user != null) {
    const allAccounts = (user.accounts || []).map(account => clearPermissions(account));
    const cleanedUser = clearAccounts(user);
    const firstAccount = allAccounts[0];

    if (user.roles != null) {
      user.roles.forEach(role => updateRole(state, role));
      state.userRoles[user.id] = user.roles.map(r => r.id);
    }

    state.users[cleanedUser.id!] = {
      user: cleanedUser,
      mainAccount: firstAccount ? firstAccount.id : undefined,
      fullStatus: user.permissions != null ? 'READY' : 'NOT_INITIALIZED',
      accounts: allAccounts != null ? allAccounts.map(a => a.id!) : [],
    };

    if (user.permissions != null) {
      state.permissions = { ...state.permissions, ...mapById(user.permissions) };
    }

    if (allAccounts != null) {
      allAccounts.forEach(a => {
        state.accounts[a.id] = a;
      });
    }
  }
}

function deleteUser(state: UserState, user: IUserWithId, account: IAbstractAccountWithId) {
  delete state.users[user.id];
  delete state.accounts[account.id];

  const roleIds = state.userRoles[user.id];

  if (roleIds != null && roleIds != 'LOADING') {
    roleIds.forEach(roleId => {
      const users = state.roleUsers[roleId];
      if (users != null && users != 'LOADING') {
        removeItem(users, user.id);
      }
    });
    delete state.userRoles[user.id];
  }
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(processUpdatedEntities.fulfilled, (state, action) => {
        state.permissions = { ...state.permissions, ...mapById(action.payload.permissions) };
      })
      .addCase(processDeletedEntities.fulfilled, (state, action) => {
        action.payload.permissions.forEach(id => delete state.permissions[id]);
      })
      .addCase(API.reloadCurrentUser.fulfilled, (state, action) => {
        const { currentUser, currentAccount } = action.payload;
        updateUser(state, currentUser);

        if (currentAccount && currentAccount.id != null) {
          state.accounts[currentAccount.id] = currentAccount;
        }
      })
      .addCase(API.getUser.pending, (state, action) => {
        const userId = action.meta.arg;
        if (userId != null) {
          state.users[userId] = 'LOADING';
        }
      })
      .addCase(API.getUser.fulfilled, (state, action) => {
        updateUser(state, action.payload);
      })
      .addCase(API.getFullUser.pending, (state, action) => {
        const userId = action.meta.arg;
        if (userId != null) {
          state.users[userId] = 'LOADING';
        }
      })
      .addCase(API.getFullUser.fulfilled, (state, action) => {
        updateUser(state, action.payload);
      })
      .addCase(API.getShadowUserByIds.pending, (state, action) => {
        action.meta.arg.forEach(userId => {
          state.users[userId] = 'LOADING';
        });
      })
      .addCase(API.getShadowUserByIds.fulfilled, (state, action) => {
        action.payload.forEach(user => {
          updateUser(state, user);
        });
      })
      .addCase(API.getAllUsers.fulfilled, (state, action) => {
        action.payload.forEach(user => updateUser(state, user));
      })
      .addCase(API.getAllRoles.fulfilled, (state, action) => {
        state.roles = {};
        action.payload.forEach(role => updateRole(state, role));
      })
      .addCase(API.createRole.fulfilled, (state, action) => {
        updateRole(state, action.payload);
      })
      .addCase(API.deleteRole.fulfilled, (state, action) => {
        deleteRole(state, action.payload);
      })
      .addCase(API.updateRole.fulfilled, (state, action) => {
        updateRole(state, action.payload as IRoleWithPermissions);
      })
      .addCase(API.getRoleMembers.pending, (state, action) => {
        state.roleUsers[action.meta.arg] = 'LOADING';
      })
      .addCase(API.getRoleMembers.fulfilled, (state, action) => {
        state.roleUsers[action.meta.arg] = [];
        const list = state.roleUsers[action.meta.arg] as number[];
        action.payload.forEach(user => {
          list.push(user.id);
          updateUser(state, user);
        });
      })
      .addCase(API.giveRoleToUser.fulfilled, (state, action) => {
        updateUser(state, action.payload);
        const roleId = action.meta.arg.roleId;
        const userId = action.meta.arg.userId;

        const uRoles = state.userRoles[userId];

        if (uRoles != null && uRoles != 'LOADING') {
          if (uRoles.indexOf(roleId) < 0) {
            uRoles.push(roleId);
          }
        }
        const rUsers = state.roleUsers[roleId];

        if (rUsers != null && rUsers != 'LOADING') {
          if (rUsers.indexOf(userId) < 0) {
            rUsers.push(userId);
          }
        }
      })

      .addCase(API.removeRoleFromUser.fulfilled, (state, action) => {
        const uRoles = state.userRoles[action.meta.arg.userId];

        if (uRoles != null && uRoles != 'LOADING') {
          removeItem(uRoles, action.meta.arg.roleId);
        }
        const rUsers = state.roleUsers[action.meta.arg.roleId];

        if (rUsers != null && rUsers != 'LOADING') {
          removeItem(rUsers, action.meta.arg.userId);
        }
      })
      .addCase(API.updateAccount.fulfilled, (state, action) => {
        state.accounts[action.payload.id] = action.payload;
      })
      .addCase(API.deleteAccount.fulfilled, (state, action) => {
        deleteUser(state, action.payload, action.meta.arg);
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

export default userSlice.reducer;
