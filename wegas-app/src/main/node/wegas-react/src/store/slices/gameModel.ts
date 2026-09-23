/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IGameModel, IGameModelLanguage } from 'wegas-ts-api';
import { GameModelApi } from '../../API/gameModel.api';
import { manageResponseHandler } from '../../data/actions';
import { managedResponseReceived } from '../actions';
import { selectEdition } from './edition';
import { setInitStatus } from './initStatus';
import { AppThunk, dispatch } from '../../store/store';

export interface GameModelState {
  /** Immutable, seeded from the server-injected CurrentGM global. */
  currentGameModelId: number;
  entities: Record<number, Readonly<IGameModel>>;
}

const initialState: GameModelState = {
  currentGameModelId: CurrentGM.id!,
  entities: { [CurrentGM.id!]: CurrentGM },
};

/**
 * Fetch a game model.
 */
export const getGameModel = createAsyncThunk(
  'gameModel/fetch',
  async (gameModelId: number, thunkAPI) => {
    const res = await GameModelApi.get(gameModelId);

    dispatch(manageResponseHandler(res));
    thunkAPI.dispatch(setInitStatus({ key: 'gameModel', status: true }));
  },
);

/**
 * Live-edit an entity on a channel. Routes the response through the editing store
 * (legacy) and the managed-response funnel.
 */
export function liveEdition<T extends IMergeable>(
  channel: string,
  entity: T,
): AppThunk {
  return async (dispatch, getState) => {
    const res = await GameModelApi.liveEdition(channel, entity)
    dispatch(manageResponseHandler(res, dispatch, selectEdition(getState())))
  };
}

export function createExtraTestPlayer(gameModelId: number): AppThunk {
  return async (dispatch, getState) => {
    const res = await GameModelApi.createExtraTestPlayer(gameModelId)
    dispatch(manageResponseHandler(res, dispatch, selectEdition(getState())))
  };
}

const gameModelSlice = createSlice({
  name: 'gameModel',
  initialState,
  reducers: {
    editGameModel(
      state,
      action: PayloadAction<{ gameModel: IGameModel; gameModelId: number }>,
    ) {
      state.entities[action.payload.gameModelId] = action.payload.gameModel;
    },
    editLanguage(
      state,
      action: PayloadAction<{
        gameModelLanguage: IGameModelLanguage;
        gameModelId: number;
      }>,
    ) {
      const gameModel = state.entities[action.payload.gameModelId];
      if (gameModel == null) {
        return;
      }
      const langIndex = gameModel.languages.findIndex(
        language => language.code === action.payload.gameModelLanguage.code,
      );
      if (langIndex > -1) {
        gameModel.languages.splice(langIndex, 1, action.payload.gameModelLanguage);
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(managedResponseReceived, (state, action) => {
      const updated = action.payload.updatedEntities.gameModels;
      const deleted = action.payload.deletedEntities.gameModels;

      Object.keys(deleted).forEach(id => {
        delete state.entities[Number(id)];
      });

      Object.assign(state.entities, updated);
    });
  },
});

export const { editGameModel, editLanguage } = gameModelSlice.actions;
export default gameModelSlice.reducer;
