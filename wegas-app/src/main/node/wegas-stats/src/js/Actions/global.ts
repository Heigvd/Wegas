import {createAsyncThunk} from "@reduxjs/toolkit";
import {bootstrapUser} from "./userActions";

export const reset = createAsyncThunk('global/reset', (_payload, thunkApi) => {
  thunkApi.dispatch(bootstrapUser());
});
export const showOverlay = createAsyncThunk('global/showOverlay', () => {});
export const hideOverlay = createAsyncThunk('global/hideOverlay', () => {});
export const startRequest = createAsyncThunk('global/startRequest', () => {});
export const endRequest = createAsyncThunk('global/endRequest', () => {});