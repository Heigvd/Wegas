/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IPlayer, ITeam } from 'wegas-ts-api';
import { getTeams } from './teams';
import { RootState, store } from '../store';

export interface PlayersState {
  /** Immutable, seeded from the server-injected CurrentPlayerId global. */
  currentPlayerId: number;
  entities: Record<string, IPlayer>;
}

/**
 * Players are embedded in their team's payload rather than normalized by the
 * generic entity pipeline, so callers that fetch teams (initial state included)
 * must extract them explicitly.
 */
export function playersFromTeams(teams: ITeam[]): Record<string, IPlayer> {
  return teams.reduce<Record<string, IPlayer>>((acc, t) => {
    t.players.forEach(p => {
      if (p.id !== undefined) {
        acc[p.id] = p;
      }
    });
    return acc;
  }, {});
}

const initialState: PlayersState = {
  currentPlayerId: CurrentPlayerId,
  entities: playersFromTeams(CurrentGame.teams),
};

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
        delete state.entities[id];
      });
      Object.assign(state.entities, action.payload.updated);
    },
  },
  extraReducers: builder => {
    builder.addCase(getTeams.fulfilled, (state, action) => {
      Object.assign(state.entities, playersFromTeams(action.payload));
    });
  },
});

export const selectCurrentPlayerId = (state: RootState = store.getState()) =>
  state.players.currentPlayerId;

export const { updatePlayers } = playersSlice.actions;
export default playersSlice.reducer;
