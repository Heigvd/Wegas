/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { createSlice } from '@reduxjs/toolkit';
import * as API from '../../API/api';
import { setApiStatus } from '../../websocket/websocket';

export interface WegasState {
  apiStatus: 'UP' | 'DOWN' | 'OUTDATED';
}

const initialState: WegasState = {
  apiStatus: 'UP',
};

const slice = createSlice({
  name: 'global',
  initialState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(setApiStatus.fulfilled, (state, action) => {
        state.apiStatus = action.payload.status;
      })
      .addCase(API.runAs.fulfilled, () => {
        return initialState;
      })
      .addCase(API.signOut.fulfilled, () => {
        return initialState;
      }),
});

//export const {} = slice.actions;

export default slice.reducer;
