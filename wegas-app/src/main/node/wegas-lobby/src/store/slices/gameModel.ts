/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice } from '@reduxjs/toolkit';
import { IGameModelWithId } from 'wegas-ts-api';
import * as API from '../../API/api';
import { mapById } from '../../helper';
import { processDeletedEntities, processUpdatedEntities } from '../../websocket/websocket';
import { LoadingStatus } from './../store';

export interface GameModelState {
  currentUserId: number | undefined;
  status: Record<IGameModelWithId['type'], Record<IGameModelWithId['status'], LoadingStatus>>;
  gameModels: Record<number, IGameModelWithId | 'LOADING'>;
  games: Record<number, 'LOADING' | number[]>;
}

const initialState: GameModelState = {
  currentUserId: undefined,
  status: {
    MODEL: {
      LIVE: 'NOT_INITIALIZED',
      BIN: 'NOT_INITIALIZED',
      DELETE: 'NOT_INITIALIZED',
      SUPPRESSED: 'NOT_INITIALIZED',
    },
    SCENARIO: {
      LIVE: 'NOT_INITIALIZED',
      BIN: 'NOT_INITIALIZED',
      DELETE: 'NOT_INITIALIZED',
      SUPPRESSED: 'NOT_INITIALIZED',
    },
    REFERENCE: {
      LIVE: 'NOT_INITIALIZED',
      BIN: 'NOT_INITIALIZED',
      DELETE: 'NOT_INITIALIZED',
      SUPPRESSED: 'NOT_INITIALIZED',
    },
    PLAY: {
      LIVE: 'NOT_INITIALIZED',
      BIN: 'NOT_INITIALIZED',
      DELETE: 'NOT_INITIALIZED',
      SUPPRESSED: 'NOT_INITIALIZED',
    },
  },
  gameModels: {},
  games: {},
};

function updateParent(state: GameModelState, gameModelId: number, gameId: number) {
  state.games[gameModelId] = [gameId];
}

const slice = createSlice({
  name: 'gameModels',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(processUpdatedEntities.fulfilled, (state, action) => {
        state.gameModels = { ...state.gameModels, ...mapById(action.payload.gameModels) };
        action.payload.games.forEach(g => {
          const parentId = g.parentId;
          if (parentId != null) {
            updateParent(state, parentId, g.id);
          }
        });
      })
      .addCase(processDeletedEntities.fulfilled, (state, action) => {
        action.payload.gameModels.forEach(id => delete state.gameModels[id]);
        action.payload.games.forEach(id => delete state.games[id]);
        if (action.payload.games.length > 0) {
          Object.entries(state.games).forEach(([key, list]) => {
            if (typeof list != 'string') {
              state.games[+key] = list.filter(item => action.payload.games.indexOf(item) < 0);
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
      .addCase(API.getGameModelById.pending, (state, action) => {
        state.gameModels[action.meta.arg.id] = 'LOADING';
      })
      .addCase(API.getGameModelById.fulfilled, (state, action) => {
        state.gameModels[action.payload.id] = action.payload;
      })

      .addCase(API.getGameModelByIds.pending, (state, action) => {
        action.meta.arg.forEach(id => (state.gameModels[id] = 'LOADING'));
      })
      .addCase(API.getGameModelByIds.fulfilled, (state, action) => {
        action.payload.forEach(gameModel => {
          if (gameModel != null) {
            state.gameModels[gameModel.id] = gameModel;
          }
        });
      })
      .addCase(API.getGames.fulfilled, (state, action) => {
        action.payload.forEach(game => {
          if (game.gameModel != null) {
            state.gameModels[game.gameModel.id] = game.gameModel;
            updateParent(state, game.gameModel.id, game.id);
          }
        });
      })
      .addCase(API.getGamesPaginated.fulfilled, (state, action) => {
        state.games = [];
        state.gameModels = [];
        action.payload.pageContent.forEach(game => {
          if (game.gameModel != null) {
            state.gameModels[game.gameModel.id] = game.gameModel;
            updateParent(state, game.gameModel.id, game.id);
          }
        });
      })
      .addCase(API.getPlayers.fulfilled, (state, action) => {
        action.payload.forEach(data => {
          if (data.gameModel != null) {
            state.gameModels[data.gameModel.id] = data.gameModel;
            if (data.game != null) {
              updateParent(state, data.gameModel.id, data.game.id);
            }
          }
        });

        state.gameModels = {
          ...state.gameModels,
          ...mapById(action.payload.map(data => data.gameModel)),
        };
      })
      .addCase(API.updateLanguages.fulfilled, (state, action) => {
        action.payload.forEach(lang => {
          if (lang.parentId != null) {
            const gm = state.gameModels[lang.parentId];
            if (gm != null && gm != 'LOADING') {
              const index = gm.languages.findIndex(l => l.id === lang.id);
              if (index >= 0) {
                gm.languages.splice(index, 1, lang);
              }
            }
          }
        });
      })

      .addCase(API.getGameModels.pending, (state, action) => {
        const status = action.meta.arg.status;
        const gmType = action.meta.arg.type;

        state.status[gmType][status] = 'LOADING';
      })
      .addCase(API.getGameModels.fulfilled, (state, action) => {
        const status = action.meta.arg.status;
        const gmType = action.meta.arg.type;
        state.status[gmType][status] = 'READY';

        state.gameModels = {
          ...state.gameModels,
          ...mapById(
            action.payload.map(gameModel => {
              return { ...gameModel };
            }),
          ),
        };
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

export default slice.reducer;
