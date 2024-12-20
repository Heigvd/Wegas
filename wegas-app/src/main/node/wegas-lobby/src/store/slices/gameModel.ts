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
import { LoadingStatus } from '../store';
import { entityIs } from '../../API/entityHelper';

export interface GameModelState {
  status: Record<IGameModelWithId['type'], Record<IGameModelWithId['status'], LoadingStatus>>;
  gameModels: Record<number, IGameModelWithId | 'LOADING'>;
  /** Just a stupid data that changes when a game model is added, its status is changed or is deleted.
   * Its aim is to trigger data reloading (only needed for pagination purposes) */
  nbGameModelsChanges: number;
}

const initialState: GameModelState = {
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
  nbGameModelsChanges: 0,
};

const slice = createSlice({
  name: 'gameModels',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(processUpdatedEntities.fulfilled, (state, action) => {
        action.payload.gameModels.forEach((g: IGameModelWithId) => {
          if (state.gameModels[g.id] == undefined) {
            // add to noticeable changes the number of created game models
            state.nbGameModelsChanges++;
          } else {
            const gameModel = state.gameModels[g.id];
            // trigger change only when status changes. If no condition on what changed, it would be updated a lot, really
            if (entityIs(gameModel, 'GameModel') && gameModel.status != g.status) {
              // add to noticeable changes the number of game models that had a status change
              state.nbGameModelsChanges++;
            }
          }
        })

        state.gameModels = { ...state.gameModels, ...mapById(action.payload.gameModels) };
      })
      .addCase(processDeletedEntities.fulfilled, (state, action) => {
        action.payload.gameModels.forEach(id => {
          delete state.gameModels[id];
          // add to noticeable changes the number of deleted game models
          state.nbGameModelsChanges++;
        });
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
          }
        });
      })
      .addCase(API.getGamesPaginated.fulfilled, (state, action) => {
        action.payload.pageContent.forEach(game => {
          if (game.gameModel != null) {
            state.gameModels[game.gameModel.id] = game.gameModel;
          }
        });
      })
      .addCase(API.getPlayers.fulfilled, (state, action) => {
        action.payload.forEach(data => {
          if (data.gameModel != null) {
            state.gameModels[data.gameModel.id] = data.gameModel;
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
      .addCase(API.getGameModelsPaginated.fulfilled, (state, action) => {
        state.gameModels = {
          ...state.gameModels,
          ...mapById(
              action.payload.pageContent.map(gameModel => {
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
