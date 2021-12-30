import {createSlice} from "@reduxjs/toolkit";
import {showOverlay, hideOverlay, startRequest, endRequest, reset} from "../Actions/global";

export interface GlobalStore {
  overlay: number;
  request: number;
}

const defaultState: GlobalStore = {
  overlay: 0,
  request: 0,
};

const slice = createSlice({
  name: 'global',
  initialState: defaultState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(showOverlay.pending, state => {state.overlay++})
      .addCase(hideOverlay.fulfilled, state => {Math.max(state.overlay--, 0)})
      .addCase(startRequest.pending, state => {state.request++})
      .addCase(endRequest.fulfilled, state => {Math.max(state.request--, 0)})
      .addCase(reset.pending, () => defaultState)
});

export default slice.reducer;
