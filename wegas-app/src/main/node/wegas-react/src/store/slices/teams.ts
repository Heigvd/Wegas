/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ITeam } from 'wegas-ts-api';
import { TeamAPI } from '../../API/teams.api';
import { manageResponseHandler } from '../../data/actions';
import { editingStore } from '../../data/Stores/editingStore';

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

/**
 * A player only ever needs their own team, so the caller resolves gameId /
 * teamId (from the still-legacy global slice) rather than this thunk
 * reaching into that store itself.
 * TODO teams migration: once `global` moves to this store, gameId/teamId
 * could be read here directly and callers wouldn't need to pass them.
 */
export const getTeams = createAsyncThunk(
  'teams/getAll',
  async (args: { gameId: number; teamId: number }) => {
    if (APP_CONTEXT === 'Player') {
      return [await TeamAPI.getTeam(args.gameId, args.teamId)];
    } else {
      return await TeamAPI.getAll(args.gameId);
    }
  },
);

/**
 * Update a team.
 *
 * The resulting team lands in this slice through the managed-response funnel
 * (manageResponseHandler dispatches `updateTeams` to this store), so there is
 * nothing to reduce here. It is routed through the editing store as well, which
 * the funnel does not reach on its own.
 */
export async function updateTeam(team: ITeam) {
  const res = await TeamAPI.update(CurrentGM.id!, CurrentGame.id!, team);
  editingStore.dispatch(manageResponseHandler(res));
}

/**
 * Change the current player's language.
 */
export async function changePlayerLanguage(codeLang: string) {
  const res = await TeamAPI.changePlayerLanguage(
    CurrentTeamId,
    CurrentPlayerId,
    codeLang,
  );
  // manageResponseHandler already dispatches to the old store and fans the
  // payload out to this one, so its returned action needs no further dispatch.
  manageResponseHandler(res);
}

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
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
  extraReducers: builder => {
    builder.addCase(getTeams.fulfilled, (_state, action) => {
      return teamsById(action.payload);
    });
  },
});

export const { updateTeams } = teamsSlice.actions;
export default teamsSlice.reducer;
