/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice } from '@reduxjs/toolkit';
import { IPlayerWithId, ITeamWithId } from 'wegas-ts-api';
import * as API from '../../API/api';
import { merge } from '../../helper';
import { processDeletedEntities, processUpdatedEntities } from '../../websocket/websocket';
import { LoadingStatus } from './../store';

export interface TeamState {
  currentUserId: number | undefined;
  status: LoadingStatus;
  teams: Record<number, ITeamWithId>;
  players: Record<number, 'LOADING' | number[]>;
}

const initialState: TeamState = {
  currentUserId: undefined,
  status: 'NOT_INITIALIZED',
  teams: {},
  players: {},
};

function removePlayer(state: TeamState, player: IPlayerWithId) {
  const playerId = player.id;
  const teamId = player.parentId;
  if (teamId != null) {
    const team = state.teams[teamId];
    if (team != null) {
      const index = team.players.findIndex(p => p.id === playerId);
      if (index >= 0) {
        team.players.splice(index, 1);
        if (team.players.length === 0) {
          delete state.teams[teamId];
        }
      }
    }
  }
}

const slice = createSlice({
  name: 'teams',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(processUpdatedEntities.fulfilled, (state, action) => {
        action.payload.teams.forEach(team => {
          state.teams[team.id] = team;
          state.players[team.id] = team.players.map(p => p.id!);
        });

        //state.teams = merge(state.teams, action.payload.teams);
        action.payload.players.forEach(p => {
          const parentId = p.parentId;
          if (parentId != null) {
            const parentState = state.players[parentId];
            if (parentState != null && parentState != 'LOADING') {
              if (parentState.indexOf(p.id) < 0) {
                parentState.push(p.id);
              }
            }
          }
        });
      })
      .addCase(processDeletedEntities.fulfilled, (state, action) => {
        action.payload.teams.forEach(id => delete state.teams[id]);
        action.payload.players.forEach(id => delete state.players[id]);
        if (action.payload.players.length > 0) {
          Object.entries(state.players).forEach(([key, list]) => {
            if (typeof list != 'string') {
              state.players[+key] = list.filter(item => action.payload.players.indexOf(item) < 0);
            }
          });
        }
      })
      .addCase(API.reloadCurrentUser.fulfilled, (state, action) => {
        // hack: to build state.mine projects, currentUserId must be known
        state.currentUserId = action.payload.currentUser
          ? action.payload.currentUser.id || undefined
          : undefined;
      })
      .addCase(API.getTeamById.fulfilled, (state, action) => {
        state.teams[action.payload.id] = action.payload;
      })
      .addCase(API.getAllTeams.fulfilled, (state, action) => {
        state.teams = merge(state.teams, action.payload);
      })
      .addCase(API.getPlayers.fulfilled, (state, action) => {
        state.teams = merge(
          state.teams,
          action.payload.map(data => data.team),
        );
      })
      .addCase(API.leaveGame.fulfilled, (state, action) => {
        removePlayer(state, action.payload);
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

export default slice.reducer;
