import {createSlice} from "@reduxjs/toolkit";
import {fetchGamesForLogId} from "../Actions/gamesActions";
import {reset} from "../Actions/global";
import {GameAdmin} from "../API/wegas";

export interface GameState {
  games: GameAdmin[];
}

const defaultState: GameState = {
  games: [],
};

const slice = createSlice({
  name: 'games',
  initialState: defaultState,
  reducers: {},
  extraReducers: builder =>
    builder
      .addCase(fetchGamesForLogId.fulfilled, (state, action) => {
        state.games = action.payload;
      })
      .addCase(reset.pending, () => defaultState)
});

export default slice.reducer;
