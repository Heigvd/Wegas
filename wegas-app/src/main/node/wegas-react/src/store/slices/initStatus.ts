/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
});

export const { setInitStatus } = initStatusSlice.actions;
export default initStatusSlice.reducer;
