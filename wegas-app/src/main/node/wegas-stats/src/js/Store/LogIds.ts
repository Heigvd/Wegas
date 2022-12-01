import {createSlice} from '@reduxjs/toolkit';
import {reset} from '../Actions/global';
import {bootstrapLogIds, selectLogId} from '../Actions/logIdsActions';

export interface LogIdState {
  status: number;
  value: string[];
  current: string | null;
}

const defaultState: LogIdState = {
  status: 0,
  value: [],
  current: null,
};


const slice = createSlice({
  name: 'logIds',
  initialState: defaultState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(bootstrapLogIds.fulfilled, (state, action) => {
        state.value = action.payload;
        state.current = null;
        state.status = 1;
      })
      .addCase(selectLogId.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(reset.pending, () => defaultState)
});

export default slice.reducer;
