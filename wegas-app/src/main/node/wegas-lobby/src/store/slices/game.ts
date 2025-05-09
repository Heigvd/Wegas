/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice } from '@reduxjs/toolkit';
import { IGameWithId } from 'wegas-ts-api';
import * as API from '../../API/api';
import { mapById } from '../../helper';
import { processDeletedEntities, processUpdatedEntities } from '../../websocket/websocket';
import { LoadingStatus } from '../store';
import { entityIs } from '../../API/entityHelper';

export interface GameState {
  status: Record<IGameWithId['status'], LoadingStatus>;
  games: Record<number, IGameWithId | 'LOADING'>;
  teams: Record<number, 'LOADING' | number[]>;
  joinStatus: Record<number, 'JOINING' | 'JOINED'>;
  /** Just a stupid data that changes when a game model is added, its status is changed or is deleted.
   * Its aim is to trigger data reloading (only needed for pagination purposes) */
  nbGameChanges: number;
}

const initialState: GameState = {
  status: {
    LIVE: 'NOT_INITIALIZED',
    BIN: 'NOT_INITIALIZED',
    DELETE: 'NOT_INITIALIZED',
    SUPPRESSED: 'NOT_INITIALIZED',
  },
  games: {},
  teams: {},
  joinStatus: {},
  nbGameChanges: 0,
};

const slice = createSlice({
  name: 'games',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(processUpdatedEntities.fulfilled, (state, action) => {
        action.payload.games.forEach((g: IGameWithId) => {
          if (state.games[g.id]) {
            // add to noticeable changes the number of created games
            state.nbGameChanges++;
          } else {
            const game = state.games[g.id];
            // trigger change only when status changes. If no condition on what changed, it would be updated a lot, really
            if (entityIs(game, 'Game') && game.status !== g.status) {
              // add to noticeable changes the number of games that had a status change
              state.nbGameChanges++;
            }
          }
        })

        state.games = { ...state.games, ...mapById(action.payload.games) };

        action.payload.teams.forEach(t => {
          const parentId = t.parentId;
          if (parentId != null) {
            const parentState = state.teams[parentId];
            if (parentState != null && parentState != 'LOADING') {
              if (parentState.indexOf(t.id) < 0) {
                parentState.push(t.id);
              }
            }
          }
        });
      })
      .addCase(processDeletedEntities.fulfilled, (state, action) => {
        action.payload.games.forEach(id => {
          delete state.games[id];
          // add to noticeable changes the number of deleted games
          state.nbGameChanges++;
        });

        action.payload.teams.forEach(id => delete state.teams[id]);
        if (action.payload.teams.length > 0) {
          Object.entries(state.teams).forEach(([key, list]) => {
            if (typeof list != 'string') {
              state.teams[+key] = list.filter(item => action.payload.teams.indexOf(item) < 0);
            }
          });
        }
      })
      .addCase(API.findGameByToken.fulfilled, (state, action) => {
        const id = action.payload.game.id;
        state.games[id] = action.payload.game;
      })
      .addCase(API.getGameById.pending, (state, action) => {
        state.games[action.meta.arg.id] = 'LOADING';
      })
      .addCase(API.getGameById.fulfilled, (state, action) => {
        state.games[action.payload.id] = action.payload;
      })
      .addCase(API.getGameByIds.pending, (state, action) => {
        action.meta.arg.forEach(id => (state.games[id] = 'LOADING'));
      })
      .addCase(API.getGameByIds.fulfilled, (state, action) => {
        action.payload.forEach(game => (state.games[game.id] = game));
      })
      .addCase(API.getGames.pending, (state, action) => {
        const status = action.meta.arg;
        state.status[status] = 'LOADING';
      })
      .addCase(API.getGames.fulfilled, (state, action) => {
        const status = action.meta.arg;

        state.status[status] = 'READY';

        state.games = {
          ...state.games,
          ...mapById(
            action.payload.map(game => {
              const g = { ...game };
              // we remove the gameModel because it would not be updated. If the gameModel is needed, fetch it from gameModel slice
              delete g.gameModel;
              return g;
            }),
          ),
        };
      })
      .addCase(API.getGamesPaginated.fulfilled, (state, action) => {
        state.games = {
          ...state.games,
          ...mapById(
            action.payload.pageContent.map(game => {
              const g = { ...game };
              // we remove the gameModel because it would not be updated. If the gameModel is needed, fetch it from gameModel slice
              delete g.gameModel;
              return g;
            }),
          ),
        };
      })
      .addCase(API.getAllTeams.pending, (state, action) => {
        state.teams[action.meta.arg] = 'LOADING';
      })
      .addCase(API.getAllTeams.fulfilled, (state, action) => {
        state.teams[action.meta.arg] = action.payload.map(t => t.id);
      })
      .addCase(API.getPlayers.fulfilled, (state, action) => {
        state.games = { ...state.games, ...mapById(action.payload.map(data => data.game)) };
      })
      .addCase(API.joinIndividually.pending, (state, action) => {
        state.joinStatus[action.meta.arg.id] = 'JOINING';
      })
      .addCase(API.joinIndividually.fulfilled, (state, action) => {
        state.joinStatus[action.meta.arg.id] = 'JOINED';
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

export default slice.reducer;
