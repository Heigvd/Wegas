/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useAppSelector } from '../hooks';
import type { RootState } from '../store';
import { getTeams } from './teams';
import { getGame } from './game';

export type InitStateKey =
  | 'variables'
  | 'instances'
  | 'pages'
  | 'components'
  | 'game'
  | 'gameModel'
  | 'teams'
  | 'clientScriptsEvaluationDone';

/**
 * Indicates if slices have been fully initialized
 */
export type InitState = Record<InitStateKey, boolean>;

const initialState: InitState = {
  instances: false,
  variables: false,
  pages: false,
  components: false,
  game: false,
  gameModel: false,
  teams: false,
  clientScriptsEvaluationDone: false,
};

const initStatusSlice = createSlice({
  name: 'initStatuses',
  initialState,
  reducers: {
    setInitStatus(
      state,
      action: PayloadAction<{ key: InitStateKey; status: boolean }>,
    ) {
      state[action.payload.key] = action.payload.status;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getTeams.fulfilled, state => {
        state.teams = true;
      })
      .addCase(getGame.fulfilled, state => {
        state.game = true;
      });
  },
});

export const { setInitStatus } = initStatusSlice.actions;
export default initStatusSlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export function selectIsReadyForClientScript(state: RootState): boolean {
  const { initStatuses } = state;
  return (
    initStatuses.instances &&
    initStatuses.variables &&
    initStatuses.gameModel &&
    initStatuses.game &&
    initStatuses.teams
  );
}

/**
 * In order to execute clientScript properly, some slices must have been fully initialized.
 *
 * This hook indicates whether or not the store is ready for client script execution
 */
export function useIsReadyForClientScript(): boolean {
  return useAppSelector(selectIsReadyForClientScript);
}

export function selectIsReadyForPageDisplay(state: RootState): boolean {
  const { initStatuses } = state;
  return (
    initStatuses.pages &&
    initStatuses.clientScriptsEvaluationDone &&
    initStatuses.components
  );
}

/**
 * This hook indicates if pages are ready to be displayed.
 */
export function useIsReadyForPageDisplay(): boolean {
  return useAppSelector(selectIsReadyForPageDisplay);
}
