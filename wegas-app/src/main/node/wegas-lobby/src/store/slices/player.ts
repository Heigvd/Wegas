/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice } from '@reduxjs/toolkit';
import { IPlayerWithId } from 'wegas-ts-api';
import * as API from '../../API/api';
import { mapById, merge } from '../../helper';
import {
  decQueue,
  processDeletedEntities,
  processUpdatedEntities,
} from '../../websocket/websocket';
import { LoadingStatus } from './../store';

export interface PlayerState {
  currentUserId: number | undefined;
  status: LoadingStatus;
  // players owned by the current user
  players: Record<number, IPlayerWithId>;
}

const initialState: PlayerState = {
  currentUserId: undefined,
  status: 'NOT_INITIALIZED',
  players: {},
};

const playerSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(processUpdatedEntities.fulfilled, (state, action) => {
        state.players = merge(state.players, action.payload.players);
      })
      .addCase(processDeletedEntities.fulfilled, (state, action) => {
        action.payload.players.forEach(id => delete state.players[id]);
      })
      .addCase(API.getPlayerById.fulfilled, (state, action) => {
        state.players[action.payload.id] = action.payload;
      })
      .addCase(API.reloadCurrentUser.fulfilled, (state, action) => {
        // hack: to build state.mine projects, currentUserId must be known
        state.currentUserId = action.payload.currentUser
          ? action.payload.currentUser.id || undefined
          : undefined;
      })
      .addCase(API.getPlayers.pending, state => {
        state.status = 'LOADING';
      })
      .addCase(API.getPlayers.fulfilled, (state, action) => {
        state.status = 'READY';
        state.players = mapById(action.payload.map(data => data.player));
      })
      .addCase(API.leaveGame.fulfilled, (state, action) => {
        const playerId = action.payload.id;
        if (playerId != null) {
          delete state.players[playerId];
        }
      })
      .addCase(decQueue.fulfilled, (state, action) => {
        const amount = action.payload;
        Object.values(state.players).forEach(player => {
          if (player.queueSize != null && player.queueSize > amount) {
            player.queueSize -= amount;
          } else {
            player.queueSize = 0;
          }
        });
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

export default playerSlice.reducer;
