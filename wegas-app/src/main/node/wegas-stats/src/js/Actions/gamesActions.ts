import {getGameForLogId} from '../API/neo4j';
import {getGameModelForGame, getVariables, getGamesByIds} from '../API/wegas';
import {startRequest, endRequest} from './global';
import {createAsyncThunk} from '@reduxjs/toolkit';

export const fetchGamesForLogId = createAsyncThunk('games/fetchForLogID', async (logId: string, thunkApi) => {
  thunkApi.dispatch(startRequest());
  try {
    const gameIds = await getGameForLogId(logId);
    const games = await getGamesByIds(gameIds);
    return games;
  } finally {
    thunkApi.dispatch(endRequest());
  }
});

export const fetchVariables = createAsyncThunk('games/fetchVariables', async (gameId: number, thunkApi) => {
  thunkApi.dispatch(startRequest());
  try {
    const gameModelId = await getGameModelForGame(gameId);
    const variables = await getVariables(gameModelId);
    return variables;
  } finally {
    thunkApi.dispatch(endRequest());
  }
});