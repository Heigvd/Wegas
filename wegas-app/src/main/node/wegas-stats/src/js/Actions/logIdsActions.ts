import {createAsyncThunk} from '@reduxjs/toolkit';
import {getLogIds} from '../API/neo4j';
import {fetchGamesForLogId} from './gamesActions';
import {startRequest, endRequest} from './global';


export const bootstrapLogIds = createAsyncThunk('logid/bootstrap', async (_payload: void, thunkApi) => {
  thunkApi.dispatch(startRequest());
  const data = await getLogIds();
  thunkApi.dispatch(endRequest());
  return data;
});

export const selectLogId = createAsyncThunk('logid/select', async (logId: string, thunkApi) => {
  thunkApi.dispatch(fetchGamesForLogId(logId));
  return logId;
});
