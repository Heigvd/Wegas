/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { createSlice } from '@reduxjs/toolkit';
import * as API from '../../API/api';
import { ILevelDescriptor, OnlineUser } from '../../API/restClient';
import { mapByKey } from '../../helper';
import { reinitOnlineUsers } from '../../websocket/websocket';
import { shallowEqual } from '../hooks';
import { LoadingStatus } from '../store';

export interface AdminState {
  // userId => OnlineUser;
  onlineUsers: Record<number, OnlineUser> | 'NOT_INITIALIZED' | 'LOADING';
  loggers: Record<string, ILevelDescriptor> | undefined | null;
  userStatus: LoadingStatus;
  rolesStatus: LoadingStatus;
}

const initialState: AdminState = {
  loggers: undefined,
  userStatus: 'NOT_INITIALIZED',
  onlineUsers: 'NOT_INITIALIZED',
  rolesStatus: 'NOT_INITIALIZED',
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(API.getAllUsers.pending, state => {
        state.userStatus = 'LOADING';
      })
      .addCase(API.getAllUsers.fulfilled, state => {
        state.userStatus = 'READY';
      })
      .addCase(API.getAllRoles.pending, state => {
        state.rolesStatus = 'LOADING';
      })
      .addCase(API.getAllRoles.fulfilled, state => {
        state.rolesStatus = 'READY';
      })
      //      .addCase(API.getOnlineUsers.pending, state => {
      //        state.onlineUsers = 'LOADING';
      //      })
      .addCase(API.getOnlineUsers.fulfilled, (state, action) => {
        const s = state.onlineUsers;
        if (typeof s === 'string') {
          state.onlineUsers = mapByKey(action.payload, 'userId');
        } else {
          const currents = { ...s };
          action.payload.forEach(user => {
            const userId = user.userId;
            const current = s[userId];

            delete currents[userId];

            if (current != null) {
              if (!shallowEqual(current, user)) {
                s[userId] = user;
              }
            } else {
              s[userId] = user;
            }
          });

          Object.keys(currents).forEach(userId => delete s[+userId]);
        }
      })
      .addCase(API.syncOnlineUsers.pending, state => {
        state.onlineUsers = 'LOADING';
      })
      .addCase(API.syncOnlineUsers.fulfilled, (state, action) => {
        state.onlineUsers = mapByKey(action.payload, 'userId');
      })
      .addCase(reinitOnlineUsers.fulfilled, state => {
        state.onlineUsers = 'NOT_INITIALIZED';
      })
      .addCase(API.getLoggerLevels.pending, state => {
        // undefined means not-loaded
        if (state.loggers === undefined) {
          // null means loading
          state.loggers = null;
        }
      })
      .addCase(API.getLoggerLevels.fulfilled, (state, action) => {
        state.loggers = action.payload;
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

//export const {} = adminSlice.actions;

export default adminSlice.reducer;