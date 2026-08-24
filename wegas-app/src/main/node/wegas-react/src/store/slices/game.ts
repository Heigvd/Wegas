/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IGame } from 'wegas-ts-api';
import { GameAPI } from '../../API/games.api';
import { managedResponseReceived } from '../actions';
import { setInitStatus } from './initStatus';

export interface GameState {
  /** Immutable, seeded from the server-injected CurrentGame global. */
  currentGameId: number;
  entities: Record<number, Readonly<IGame>>;
}

const initialState: GameState = {
  currentGameId: CurrentGame.id!,
  entities: { [CurrentGame.id!]: CurrentGame },
};

/**
 * Fetch the current game.
 */
export const getGame = createAsyncThunk('game/fetch', async (_, thunkAPI) => {
  const game = await GameAPI.get(CurrentGame.id!);
  thunkAPI.dispatch(setInitStatus({ key: 'game', status: true }));

  return game;
});

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getGame.fulfilled, (state, action) => {
        if (action.payload.id !== undefined) {
          state.entities[action.payload.id] = action.payload;
        }
      })
      .addCase(managedResponseReceived, (state, action) => {
        const updated = action.payload.updatedEntities.games;
        const deleted = action.payload.deletedEntities.games;

        Object.keys(deleted).forEach(id => {
          delete state.entities[Number(id)];
        });

        Object.assign(state.entities, updated);
      });
  },
});

export default gameSlice.reducer;
