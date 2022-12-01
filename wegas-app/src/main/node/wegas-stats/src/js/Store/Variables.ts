import {createSlice} from "@reduxjs/toolkit";
import {fetchVariables} from "../Actions/gamesActions";
import {IVariableDescriptor} from 'wegas-ts-api';
import {reset} from "../Actions/global";

export interface VariableState {
  variables: IVariableDescriptor[]
}

const defaultState: VariableState = {
  variables: [],
};

const slice = createSlice({
  name: 'variables',
  initialState: defaultState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(fetchVariables.fulfilled, (state, action) => {
        state.variables = action.payload;
      })
      .addCase(reset.pending, () => defaultState)
});

export default slice.reducer;
