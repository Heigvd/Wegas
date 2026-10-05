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
import { manageResponseHandler } from '../managedResponse';
import { dispatch, RootState, store } from '../store';

export interface TeamsState {
  /** Immutable, seeded from the server-injected CurrentTeamId global. */
  currentTeamId: number;
  entities: Record<string, ITeam>;
}

function teamsById(teams: ITeam[]): TeamsState['entities'] {
  return teams.reduce<TeamsState['entities']>((acc, t) => {
    if (t.id !== undefined) {
      acc[t.id] = t;
    }
    return acc;
  }, {});
}

const initialState: TeamsState = {
  currentTeamId: CurrentTeamId,
  entities: teamsById(CurrentGame.teams || []),
};

/**
 * A player only ever needs their own team, hence the two shapes.
 *
 * The ids come from the server-injected globals rather than from getState():
 * they are what seeds this slice and the games one in the first place, and
 * reading them here would make the thunk's type depend on RootState, which is
 * itself derived from this reducer.
 */
export const getTeams = createAsyncThunk('teams/getAll', async () => {
  if (APP_CONTEXT === 'Player') {
    return [await TeamAPI.getTeam(CurrentGame.id!, CurrentTeamId)];
  } else {
    return await TeamAPI.getAll(CurrentGame.id!);
  }
});

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
  dispatch(manageResponseHandler(res));
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
  // manageResponseHandler applies the response to the store itself, so its
  // returned no-op action needs no dispatch.
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
        delete state.entities[id];
      });
      Object.assign(state.entities, action.payload.updated);
    },
  },
  extraReducers: builder => {
    builder.addCase(getTeams.fulfilled, (state, action) => {
      state.entities = teamsById(action.payload);
    });
  },
});

export const selectCurrentTeamId = (state: RootState = store.getState()) =>
  state.teams.currentTeamId;

export const { updateTeams } = teamsSlice.actions;
export default teamsSlice.reducer;
