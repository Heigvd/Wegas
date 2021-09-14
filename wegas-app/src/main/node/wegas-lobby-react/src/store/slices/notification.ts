/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WegasErrorMessage } from '../../API/restClient';
//import * as API from '../API/api';

export interface ColabNotification {
  status: 'OPEN' | 'CLOSED';
  type: 'ERROR' | 'INFO' | 'WARN';
  message: WegasErrorMessage | string;
}

const initialState: ColabNotification[] = [];

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<ColabNotification>) => {
      state.push(action.payload);
    },
    closeNotification: (state, action: PayloadAction<number>) => {
      const notif = state[action.payload];
      if (notif) {
        notif.status = 'CLOSED';
      }
    },
  },
  extraReducers: undefined,
});

export const { addNotification, closeNotification } = slice.actions;

export default slice.reducer;
