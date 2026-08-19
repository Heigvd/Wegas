/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ITeam } from 'wegas-ts-api';

export interface TeamsState {
  [id: string]: ITeam;
}

function teamsById(teams: ITeam[]): TeamsState {
  return teams.reduce<TeamsState>((acc, t) => {
    if (t.id !== undefined) {
      acc[t.id] = t;
    }
    return acc;
  }, {});
}

const initialState: TeamsState = teamsById(CurrentGame.teams || []);

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setTeams: {
      reducer(_state, action: PayloadAction<TeamsState>) {
        return action.payload;
      },
      prepare(teams: ITeam[]) {
        return { payload: teamsById(teams) };
      },
    },
    updateTeams(
      state,
      action: PayloadAction<{
        updated: Record<string, ITeam>;
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

export const { setTeams, updateTeams } = teamsSlice.actions;
export default teamsSlice.reducer;
