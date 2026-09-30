/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LanguagesAPI } from '../../API/languages.api';
import {
  EditorLanguageData,
  EditorLanguagesCode,
  getSavedLanguage,
  getUserLanguage,
} from '../../data/i18n';
import type { AppThunk, RootState } from '../store';

export interface LanguagesState {
  /** the language of the editor's own UI (not the scenario's languages) */
  currentEditorLanguageCode: EditorLanguagesCode;
  /** the languages known by Deepl; undefined until first requested */
  translatableLanguages: undefined | 'loading' | string[];
  /** the languages the user is allowed to edit; undefined until first requested */
  editableLanguages: undefined | 'loading' | 'all' | string[];
}

// Lazy: localStorage is read when the store is created, not at import time.
const initialState = (): LanguagesState => ({
  currentEditorLanguageCode: getSavedLanguage() || getUserLanguage(),
  translatableLanguages: undefined,
  editableLanguages: undefined,
});

/* ------------------------------------------------------------------ *
 * Thunks
 *
 * Both lists are fetched once, on first use. `condition` makes concurrent
 * requests from several mounting components collapse into one. On failure the
 * value stays 'loading', as before: resetting it would retry on every render.
 * ------------------------------------------------------------------ */

export const fetchTranslatableLanguages = createAsyncThunk(
  'languages/fetchTranslatable',
  () => LanguagesAPI.getAvailableLanguages(),
  {
    condition: (_, { getState }) =>
      (getState() as RootState).languages.translatableLanguages === undefined,
  },
);

export const fetchEditableLanguages = createAsyncThunk(
  'languages/fetchEditable',
  () => LanguagesAPI.getEditableLanguages(),
  {
    condition: (_, { getState }) =>
      (getState() as RootState).languages.editableLanguages === undefined,
  },
);

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const languagesSlice = createSlice({
  name: 'languages',
  initialState,
  reducers: {
    editorLanguageChanged(state, action: PayloadAction<EditorLanguagesCode>) {
      state.currentEditorLanguageCode = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTranslatableLanguages.pending, state => {
        state.translatableLanguages = 'loading';
      })
      .addCase(fetchTranslatableLanguages.fulfilled, (state, action) => {
        state.translatableLanguages = action.payload;
      })
      .addCase(fetchEditableLanguages.pending, state => {
        state.editableLanguages = 'loading';
      })
      .addCase(fetchEditableLanguages.fulfilled, (state, action) => {
        // ["*"] means every language is editable, and new ones can be created
        state.editableLanguages =
          action.payload.length === 1 && action.payload[0] === '*'
            ? 'all'
            : action.payload;
      });
  },
});

export const { editorLanguageChanged } = languagesSlice.actions;
export default languagesSlice.reducer;

/** Switch the editor's UI language and remember it for this game model. */
export const setEditorLanguage =
  (lang: EditorLanguagesCode): AppThunk =>
  dispatch => {
    window.localStorage.setItem(EditorLanguageData, lang);
    dispatch(editorLanguageChanged(lang));
  };

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const selectCurrentEditorLanguage = (s: RootState): EditorLanguagesCode =>
  s.languages.currentEditorLanguageCode;

export const selectTranslatableLanguages = (
  s: RootState,
): LanguagesState['translatableLanguages'] => s.languages.translatableLanguages;

export const selectEditableLanguages = (
  s: RootState,
): LanguagesState['editableLanguages'] => s.languages.editableLanguages;