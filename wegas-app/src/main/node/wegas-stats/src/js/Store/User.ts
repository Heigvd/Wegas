
import {createSlice} from '@reduxjs/toolkit';
import {reset} from '../Actions/global';
import {bootstrapUser} from '../Actions/userActions';

import {UserState} from '../API/user';

const defaultState: UserState = {
  isLoggedIn: false,
};

const slice = createSlice({
  name: 'user',
  initialState: defaultState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(bootstrapUser.fulfilled, (_state, action) => action.payload)
      .addCase(reset.pending, () => defaultState)
});

export default slice.reducer;
