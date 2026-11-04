/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice } from '@reduxjs/toolkit';
import type { IUser } from 'wegas-ts-api';
import { RootState, store } from '../store';

export interface UserState {
  /** Immutable, seeded from the server-injected CurrentUser global. */
  currentUser: Readonly<IUser>;
}

const initialState: UserState = {
  currentUser: CurrentUser,
};

/**
 * The logged-in user never changes within a session: no reducer touches it, the
 * slice exists so the value is read the same way as every other piece of state.
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
});

/**
 * Dual-use: called with no argument it reads the store synchronously
 * (imperative, non-React callers); passed to useAppSelector it receives the
 * state and acts as a reactive selector.
 */
export const selectCurrentUser = (state: RootState = store.getState()) =>
  state.user.currentUser;

export default userSlice.reducer;
