/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IPlayer } from 'wegas-ts-api';

export interface PlayersState {
  [id: string]: IPlayer;
}

const initialState: PlayersState = CurrentGame.teams.reduce<PlayersState>(
  (prev, t) => {
    t.players.forEach(p => {
      if (p.id !== undefined) {
        prev[p.id] = p;
      }
    });
    return prev;
  },
  {},
);

const playersSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    updatePlayers(
      state,
      action: PayloadAction<{
        updated: Record<string, IPlayer>;
        deleted?: string[];
      }>,
    ) {
      action.payload.deleted?.forEach(id => {
        delete state[id];
      });
      Object.assign(state, action.payload.updated);
    },
  },
});

export const { updatePlayers } = playersSlice.actions;
export default playersSlice.reducer;
