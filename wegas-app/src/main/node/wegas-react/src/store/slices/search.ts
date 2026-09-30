/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

/**
 * The variable tree's filter, shared with "Find usage" in the entity editor.
 */
export interface SearchState {
  /** undefined when not searching */
  value: string | undefined;
  /** also match against every field of a variable, not only its label */
  deep: boolean;
}

const initialState: SearchState = {
  value: undefined,
  deep: false,
};

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchValue(state, action: PayloadAction<string>) {
      state.value = action.payload;
    },
    clearSearch(state) {
      state.value = undefined;
    },
    /** Search for a value in every field of the variables ("Find usage"). */
    searchDeep(state, action: PayloadAction<string>) {
      state.value = action.payload;
      state.deep = true;
    },
    setSearchDeep(state, action: PayloadAction<boolean>) {
      state.deep = action.payload;
    },
  },
});

export const { setSearchValue, clearSearch, searchDeep, setSearchDeep } =
  searchSlice.actions;
export default searchSlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const selectSearch = (s: RootState): SearchState => s.search;