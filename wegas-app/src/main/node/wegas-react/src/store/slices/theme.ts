/**
 * Wegas
 * https://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { createSlice, PayloadAction, createAsyncThunk, isAnyOf } from '@reduxjs/toolkit';
import { cloneDeep } from 'lodash';
import { defaultLightMode, defaulSelectedThemes as defaultSelectedThemes, defaultTheme, defaultThemes, defaultThemesState, ModeValues, modeClass, SelectedThemes, Theme, ThemeValues, Themes, ThemesState, trainerTheme } from '../../Components/Theme/ThemeVars';
import { wwarn } from '../../Helper/wegaslog';
import { IGameModelContent } from 'wegas-ts-api';
import { addPopup } from '../../Components/PopupManager';
import { createTranslatableContent } from '../../data/i18n';
import { manageResponseHandler } from '../../data/actions';
import { entityIs } from '../../data/entities';
import { LibraryAPI, NOCONTENTMESSAGE, ServerLibraryType } from '../../API/library.api';
import { IManagedResponse } from '../../API/rest';
import { store } from '../../data/Stores/store';
import type { RootState } from '../store';

export function libraryToTheme(library: IGameModelContent) {
  const theme: Theme = JSON.parse(library.content);
  // Updating css classes in browser
  theme.modeClasses = Object.entries(theme.modes).reduce((o, [k, v]) => {
    try {
      return { ...o, [k]: modeClass(theme.values, v) };
    } catch (e) {
      wwarn(e);
      return o;
    }
  }, {});
  return theme;
}

/**
 * What changed after a Theme/SelectedThemes library was created or saved,
 * shaped by `libType` so callers (and extraReducers) don't need to
 * re-inspect the parsed content to know which one it is.
 */
type ThemeLibResult =
  | { libType: 'Theme'; themeName: string; theme: Theme; modeName?: string }
  | { libType: 'SelectedThemes'; selectedThemes: SelectedThemes };

/**
 * A precise {section, key, value} triple for a nested "sections of named
 * values" type like ModeValues/ThemeValues: `value`'s type is tied to the
 * exact `key`, which is tied to the exact `section` - a call site can't pass
 * a value from the wrong section or the wrong type for that key.
 *
 * Consuming this (as opposed to constructing/passing it) still needs one
 * cast at the write site - TS can't carry the section/key/value correlation
 * through an indexed assignment without narrowing `section` explicitly for
 * every branch.
 */
type SectionValueArg<V> = ValueOf<{
  [T in keyof V]: ValueOf<{
    [K in keyof V[T]]: { section: T; key: K; value: V[T][K] };
  }>;
}>;

function applyLibResponse(
  managedResponse: IManagedResponse,
  themeName: string,
  modeName: string | undefined,
  libType: ServerLibraryType,
): ThemeLibResult {
  manageResponseHandler(managedResponse);

  const lib = managedResponse.updatedEntities[0];
  if (!entityIs(lib, 'GameModelContent')) {
    throw new Error(`Unexpected response while saving library "${themeName}"`);
  }

  const content = JSON.parse(lib.content);
  return libType === 'Theme'
    ? { libType: 'Theme', themeName, theme: content as Theme, modeName }
    : { libType: 'SelectedThemes', selectedThemes: content as SelectedThemes };
}

/**
 * Create a brand new Theme/SelectedThemes library.
 */
async function createLib(
  themeName: string,
  theme: Theme | SelectedThemes,
  modeName: string | undefined,
  libType: ServerLibraryType,
): Promise<ThemeLibResult> {
  const managedResponse = await LibraryAPI.addLibrary(
    libType,
    'json',
    themeName,
    JSON.stringify(theme),
  );
  return applyLibResponse(managedResponse, themeName, modeName, libType);
}

/**
 * Save an existing Theme/SelectedThemes library, falling back to creating
 * it if it doesn't exist yet on the server.
 */
async function saveLib(
  themeName: string,
  newTheme: Theme | SelectedThemes,
  modeName: string | undefined,
  libType: ServerLibraryType,
): Promise<ThemeLibResult> {
  try {
    const lib = await LibraryAPI.getLibrary(libType, themeName);
    const newLib = cloneDeep(lib);
    newLib.content = JSON.stringify(newTheme);
    const managedResponse = await LibraryAPI.saveLibrary(libType, themeName, newLib);
    return applyLibResponse(managedResponse, themeName, modeName, libType);
  } catch (error) {
    if (error instanceof Error && error.message === NOCONTENTMESSAGE) {
      return createLib(themeName, newTheme, modeName, libType);
    }
    const message = error instanceof Error ? error.message : String(error);
    store.dispatch(
      addPopup('getThemeError', createTranslatableContent(undefined, message), 10000),
    );
    throw error;
  }
}

export const deleteTheme = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'theme/deleteTheme',
  async (themeName, { rejectWithValue }) => {
    if (themeName === 'default' || themeName === 'trainer') {
      store.dispatch(
        addPopup(
          'deleteThemeError',
          createTranslatableContent(undefined, `The theme "${themeName}" cannot be deleted`),
          10000,
        ),
      );
      return rejectWithValue(themeName);
    }

    const managedResponse = await LibraryAPI.deleteLibrary('Theme', themeName);
    manageResponseHandler(managedResponse);

    return themeName;
  },
);

export const getSelectedThemes = createAsyncThunk<SelectedThemes, void>(
  'theme/getSelectedThemes',
  async () => {
    try {
      const selectedLibs = await LibraryAPI.getAllLibraries('SelectedThemes');
      const selectedLib = selectedLibs['SelectedThemes']?.content;
      const selectedThemes: Partial<SelectedThemes> = selectedLib
        ? JSON.parse(selectedLib)
        : {};
      return {
        ...defaultSelectedThemes,
        ...selectedThemes,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      store.dispatch(
        addPopup(
          'getSelectedThemesError',
          createTranslatableContent(undefined, message),
          10000,
        ),
      );
      throw error;
    }
  },
)


export const getAllThemes = createAsyncThunk<Themes, void>(
  'theme/getAllThemes',
  async () => {
    try {
      const libraries = await LibraryAPI.getAllLibraries('Theme');
      const themes = Object.fromEntries(
        Object.entries(libraries).map(([themeName, library]) => [
          themeName,
          libraryToTheme(library),
        ]),
      );

      return {
        default: defaultTheme,
        trainer: trainerTheme,
        ...themes,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      store.dispatch(
        addPopup(
          'getAllThemesError',
          createTranslatableContent(undefined, message),
          10000,
        ),
      );
      throw error;
    }
  },
)

export const addNewLib = createAsyncThunk<
  ThemeLibResult,
  {
    themeName: string;
    theme?: Theme | SelectedThemes;
    modeName?: string;
    libType?: ServerLibraryType;
  },
  { state: RootState }
>(
  'theme/addNewLib',
  async ({ themeName, theme, modeName, libType = 'Theme' }, { getState }) => {
    const themesState = getState().themes;
    const newTheme = theme ?? themesState.themes[themesState.editedThemeName];
    return createLib(themeName, newTheme, modeName, libType);
  },
);

/**
 * Shared by the `updateTheme` reducer and every thunk that resolves through
 * saveLib/createLib with libType 'Theme'
 */
function applyThemeUpdate(
  state: ThemesState,
  { themeName, theme, modeName }: { themeName: string; theme: Theme; modeName?: string },
) {
  state.themes[themeName] = theme;
  state.editedThemeName = themeName;
  if (modeName != null) {
    state.editedModeName = modeName;
  }
}

export const setBaseMode = createAsyncThunk<ThemeLibResult, string, { state: RootState }>(
  'theme/setBaseMode',
  async (modeName, {getState}) => {
    const state = getState().themes;
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    newTheme.baseMode = modeName;
    return saveLib(state.editedThemeName, newTheme, undefined, 'Theme');
  }
);

export const addNewMode = createAsyncThunk<ThemeLibResult, string, { state: RootState }>(
  'theme/addNewMode',
  async (modeName, {getState}) => {
    const state = getState().themes;
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    const currentMode = newTheme.modes[state.editedModeName];
    const newMode = currentMode ? currentMode : defaultLightMode;
    newTheme.modes[modeName] = newMode;
    return saveLib(state.editedThemeName, newTheme, modeName, 'Theme');
  }
);

export const deleteMode = createAsyncThunk<
  ThemeLibResult,
  string,
  { state: RootState; rejectValue: string }
>(
  'theme/deleteMode',
  async (modeName, { getState, rejectWithValue }) => {
    const state = getState().themes;
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    const baseMode = newTheme.baseMode;

    if (modeName === baseMode) {
      store.dispatch(
        addPopup(
          'deleteBaseModeError',
          createTranslatableContent(undefined, 'You are not allowed to delete base mode'),
          10000,
        ),
      );
      return rejectWithValue(modeName);
    }

    let previousKey = baseMode;
    for (const key of Object.keys(newTheme.modes)) {
      if (key !== modeName) {
        previousKey = key;
      } else {
        break;
      }
    }
    delete newTheme.modes[modeName];

    // If the deleted mode was used as some other mode's "next mode", repoint it.
    newTheme.modes = Object.fromEntries(
      Object.entries(newTheme.modes).map(([k, m]) =>
        m.nextModeName === modeName
          ? [k, { ...m, nextModeName: previousKey }]
          : [k, m],
      ),
    );

    return saveLib(state.editedThemeName, newTheme, previousKey, 'Theme');
  },
);

export const setModeValue = createAsyncThunk<
  ThemeLibResult,
  SectionValueArg<ModeValues>,
  { state: RootState }
>(
  'theme/setModeValue',
  async ({ section, key, value }, { getState }) => {
    const state = getState().themes;
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    const sectionValues = newTheme.modes[state.editedModeName].values[section] as Record<string, unknown>;
    sectionValues[key] = value;

    newTheme.modeClasses[state.editedModeName] = modeClass(
      newTheme.values,
      newTheme.modes[state.editedModeName],
    );

    return saveLib(state.editedThemeName, newTheme, undefined, 'Theme');
  },
);

export const setNextMode = createAsyncThunk<ThemeLibResult, string, { state: RootState }>(
  'theme/setNextMode',
  async (modeName, { getState }) => {
    const state = getState().themes;
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    newTheme.modes[state.editedModeName].nextModeName = modeName;
    return saveLib(state.editedThemeName, newTheme, undefined, 'Theme');
  },
);

export const resetTheme = createAsyncThunk<
  ThemeLibResult,
  string,
  { rejectValue: string }
>(
  'theme/resetTheme',
  async (themeName, { rejectWithValue }) => {
    if (!Object.keys(defaultThemes).includes(themeName)) {
      store.dispatch(
        addPopup(
          'resetError',
          createTranslatableContent(undefined, 'You cannot reset a custom theme'),
          10000,
        ),
      );
      return rejectWithValue(themeName);
    }

    return saveLib(themeName, defaultThemes[themeName], undefined, 'Theme');
  },
);

export const setThemeValue = createAsyncThunk<
  ThemeLibResult,
  SectionValueArg<ThemeValues>,
  { state: RootState }
>(
  'theme/setThemeValue',
  async ({ section, key, value }, { getState }) => {
    const state = getState().themes;
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    const sectionValues = newTheme.values[section] as Record<string, unknown>;
    if (value == null) {
      delete sectionValues[key];
    } else {
      sectionValues[key] = value;
    }

    newTheme.modeClasses = Object.fromEntries(
      Object.entries(newTheme.modes).map(([k, m]) => [k, modeClass(newTheme.values, m)]),
    );

    return saveLib(state.editedThemeName, newTheme, undefined, 'Theme');
  },
);

export const setSelectedTheme = createAsyncThunk<
  ThemeLibResult,
  { themeName: string; contextName: keyof SelectedThemes },
  { state: RootState; rejectValue: string }
>(
  'theme/setSelectedTheme',
  async ({ themeName, contextName }, { getState, rejectWithValue }) => {
    const state = getState().themes;
    if (!Object.keys(state.themes).includes(themeName)) {
      store.dispatch(
        addPopup(
          'selectThemeError',
          createTranslatableContent(undefined, 'You cannot assign a theme that does not exist'),
          10000,
        ),
      );
      return rejectWithValue(themeName);
    }

    const newSelectedThemes = cloneDeep(state.selectedThemes);
    newSelectedThemes[contextName] = themeName;
    return saveLib('SelectedThemes', newSelectedThemes, undefined, 'SelectedThemes');
  },
);

const themeSlice = createSlice({
  name: 'themes',
  initialState: defaultThemesState,
  reducers: {
    updateTheme(
      state,
      action: PayloadAction<{themeName: string, theme: Theme, modeName?: string}>
    ){
      applyThemeUpdate(state, action.payload);
    },
    setEditedTheme(
      state,
      action: PayloadAction<string>
    ){
      if (state.themes[action.payload] != null) {
        state.editedThemeName = action.payload;
      }
    },
    setEditedMode(
      state,
      action: PayloadAction<string>
    ){
      if (
        state.themes[state.editedThemeName]?.modes[action.payload] != null
      ) {
        state.editedModeName = action.payload;
      }
    },
    updateSelectedThemes(
      state,
      action: PayloadAction<SelectedThemes>
    ){
      state.selectedThemes = action.payload;
    }
  },
  extraReducers: builder => {
    builder.addCase(deleteTheme.fulfilled, (state, action) => {
      const themeName = action.payload;
      let previousKey = 'default';
      for (const key of Object.keys(state.themes)) {
        if (key !== themeName) {
          previousKey = key;
        } else {
          break;
        }
      }
      state.editedThemeName = previousKey;
      delete state.themes[themeName];
    })
    .addCase(getSelectedThemes.fulfilled, (state, action) => {
      state.selectedThemes = action.payload;
    })
    .addCase(getAllThemes.fulfilled, (state, action: PayloadAction<Themes>) => {
      state.themes = action.payload;
    })
    .addCase(addNewLib.fulfilled, (state, action) => {
      if (action.payload.libType === 'Theme') {
        applyThemeUpdate(state, action.payload);
      } else {
        state.selectedThemes = action.payload.selectedThemes;
      }
    })
    .addCase(setSelectedTheme.fulfilled, (state, action) => {
      if (action.payload.libType === 'SelectedThemes') {
        state.selectedThemes = action.payload.selectedThemes;
      }
    })
    .addMatcher(
      isAnyOf(
        setBaseMode.fulfilled,
        addNewMode.fulfilled,
        deleteMode.fulfilled,
        setModeValue.fulfilled,
        setNextMode.fulfilled,
        resetTheme.fulfilled,
        setThemeValue.fulfilled,
      ),
      (state, action) => {
        if (action.payload.libType === 'Theme') {
          applyThemeUpdate(state, action.payload);
        }
      },
    )
  },
})


export const {
  updateTheme,
  setEditedTheme,
  setEditedMode,
  updateSelectedThemes
} = themeSlice.actions;

export default themeSlice.reducer;