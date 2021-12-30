import {createAsyncThunk} from "@reduxjs/toolkit";
import {getCurrentUser} from "../API/user";
import {bootstrapLogIds} from "./logIdsActions";

export const bootstrapUser = createAsyncThunk('user/bootstrap', async (_payload: void, thunkApi) => {
  const data = await getCurrentUser();
  if (data.isLoggedIn){
    thunkApi.dispatch(bootstrapLogIds());
  }
  return data;
});
