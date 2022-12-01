/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { createSlice } from '@reduxjs/toolkit';
import * as API from '../../API/api';
import { setPusherStatus } from '../../websocket/websocket';
import { LoadingStatus } from '../store';

export interface WebsocketState {
  client: 'UNSET' | 'CREATING' | 'FAILED' | 'READY';
  appId?: string;
  cluster?: string;
  configStatus: LoadingStatus;
  socketId?: string;
  pusherStatus: string;
}

const initialState: WebsocketState = {
  client: 'UNSET',
  configStatus: 'NOT_INITIALIZED',
  pusherStatus: 'disconnected',
};

const wsSlice = createSlice({
  name: 'websockets',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(API.initPusher.pending, state => {
        state.client = 'CREATING';
      })
      .addCase(API.initPusher.rejected, state => {
        state.client = 'FAILED';
      })
      .addCase(API.initPusher.fulfilled, (state, action) => {
        state.client = 'READY';
        state.socketId = action.payload;
      })
      .addCase(setPusherStatus.fulfilled, (state, action) => {
        state.socketId = action.payload.socketId;
        state.pusherStatus = action.payload.status;
      })
      .addCase(API.getPusherConfig.pending, state => {
        state.configStatus = 'LOADING';
      })
      .addCase(API.getPusherConfig.fulfilled, (state, action) => {
        state.configStatus = 'READY';
        state.appId = action.payload.key;
        state.cluster = action.payload.cluster;
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

//export const {} = wsSlice.actions;

export default wsSlice.reducer;
