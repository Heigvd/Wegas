/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IGame } from 'wegas-ts-api';
import { RootState, store } from '../store';
import { GameAPI } from '../../API/games.api';
import { managedResponseReceived } from '../actions';

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
export const getGame = createAsyncThunk('game/fetch', async () => {
  return await GameAPI.get(CurrentGame.id!);
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

/* ------------------------------------------------------------------ *
 * Selectors
 *
 * Dual-use: called without a state they read the store synchronously
 * (imperative callers, client scripts); passed a state they are plain
 * selectors, usable in useAppSelector.
 * ------------------------------------------------------------------ */

/** The game with this id. */
export function selectGame(id: number, state: RootState = store.getState()) {
  return state.games.entities[id];
}

/** The current game. */
export function selectCurrentGame(state: RootState = store.getState()) {
  return state.games.entities[state.games.currentGameId];
}
