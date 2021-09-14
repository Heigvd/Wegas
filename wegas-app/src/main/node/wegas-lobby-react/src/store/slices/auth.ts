/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { createSlice } from '@reduxjs/toolkit';
import * as API from '../../API/api';
import { IAaiConfigInfo } from '../../API/restClient';

export interface AuthState {
  status: 'UNKNOWN' | 'LOADING' | 'NOT_AUTHENTICATED' | 'AUTHENTICATED';
  currentUserId: number | null;
  currentAccountId: number | null;
  isAdmin?: boolean;
  isScenarist?: boolean;
  isModeler?: boolean;
  isTrainer?: boolean;
  aaiConfig: 'UNKNOWN' | 'LOADING' | IAaiConfigInfo;
}

const initialState: AuthState = {
  currentUserId: null,
  currentAccountId: null,
  status: 'UNKNOWN',
  aaiConfig: 'UNKNOWN',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    //    changeAuthenticationStatus: (
    //      state,
    //      action: PayloadAction<AuthState['authenticationStatus']>,
    //    ) => {
    //      state.authenticationStatus = action.payload;
    //    },
  },
  extraReducers: builder =>
    builder
      .addCase(API.reloadCurrentUser.pending, state => {
        state.status = 'LOADING';
      })
      .addCase(API.reloadCurrentUser.fulfilled, (state, action) => {
        if (action.payload.currentUser && action.payload.currentAccount) {
          state.currentUserId = action.payload.currentUser.id || null;
          state.currentAccountId = action.payload.currentAccount.id || null;
          state.status = 'AUTHENTICATED';
          const roles = action.payload.currentUser.roles!.map(role => role.name);
          state.isAdmin = roles.indexOf('Administrator') >= 0;
          state.isModeler = state.isAdmin;
          state.isScenarist = state.isModeler || roles.indexOf('Scenarist') >= 0;
          state.isTrainer = state.isScenarist || roles.indexOf('Trainer') >= 0;
        } else {
          state.currentUserId = null;
          state.currentAccountId = null;
          state.status = 'NOT_AUTHENTICATED';
        }
      })
      .addCase(API.getAaiConfig.pending, state => {
        state.aaiConfig = 'LOADING';
      })
      .addCase(API.getAaiConfig.fulfilled, (state, action) => {
        state.aaiConfig = action.payload;
      })
      .addCase(API.signOut.pending, state => {
        state.status = 'LOADING';
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.rejected, () => {
        return initialState;
      }),
});

export default authSlice.reducer;
