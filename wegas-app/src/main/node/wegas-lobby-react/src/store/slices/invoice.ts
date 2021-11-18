/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice } from '@reduxjs/toolkit';
import { IGameAdmin } from 'wegas-ts-api';
import * as API from '../../API/api';
import { IGameAdminWithTeams } from '../../API/restClient';
import { mapById } from '../../helper';
import { LoadingStatus } from './../store';

export interface InvoiceState {
  status: Record<NonNullable<IGameAdmin['status']>, LoadingStatus>;
  games: Record<number, IGameAdminWithTeams>;
}

const initialState: InvoiceState = {
  status: {
    TODO: 'NOT_INITIALIZED',
    PROCESSED: 'NOT_INITIALIZED',
    CHARGED: 'NOT_INITIALIZED',
  },
  games: {},
};

function getDeclaredCount(gameAdmin: IGameAdminWithTeams) {
  return (gameAdmin.teams || []).reduce((acc, cur) => {
    if (cur.declaredSize) {
      return acc + cur.declaredSize;
    } else {
      return acc;
    }
  }, 0);
}

function getEffectiveCount(gameAdmin: IGameAdminWithTeams) {
  return (gameAdmin.teams || []).reduce((acc, t) => {
    return acc + (t.players || []).length;
  }, 0);
}

function addPlayerCount(ga: IGameAdminWithTeams): IGameAdminWithTeams {
  const d = getDeclaredCount(ga);
  const e = getEffectiveCount(ga);
  return {
    ...ga,
    effectiveCount: e,
    declaredCount: d,
    diff: Math.abs(d - e),
  };
}

const slice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(API.getAdminGames.pending, (state, action) => {
        state.status[action.meta.arg] = 'LOADING';
      })
      .addCase(API.getAdminGames.fulfilled, (state, action) => {
        state.status[action.meta.arg] = 'READY';
        state.games = { ...state.games, ...mapById(action.payload.map(addPlayerCount)) };
      })
      .addCase(API.getAdminGame.fulfilled, (state, action) => {
        state.games[action.payload.id] = action.payload;
      })
      .addCase(API.updateAdminGame.fulfilled, (state, action) => {
        state.games[action.payload.id] = addPlayerCount(action.payload);
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

export default slice.reducer;
