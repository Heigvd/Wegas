import u from 'immer';
import { cloneDeep } from 'lodash';
import { applyMiddleware, compose, createStore, Reducer } from 'redux';
import thunk, { ThunkAction, ThunkMiddleware } from 'redux-thunk';
import { IGameModelContent } from 'wegas-ts-api';
import {
  ILibraries,
  LibraryAPI,
  NOCONTENTMESSAGE,
  ServerLibraryType,
} from '../../API/library.api';
import { addPopup } from '../../Components/PopupManager';
import {
  defaulSelectedThemes,
  defaultLightMode,
  defaultTheme,
  defaultThemes,
  defaultThemesState,
  modeClass,
  ModeValues,
  SelectedThemes,
  Theme,
  Themes,
  ThemesState,
  ThemeValues,
  trainerTheme,
} from '../../Components/Theme/ThemeVars';
import { wwarn } from '../../Helper/wegaslog';
import { manageResponseHandler } from '../actions';
import { createStoreConnector } from '../connectStore';
import { entityIs } from '../entities';
import { createTranslatableContent } from '../i18n';
import { store } from './store';

const globalDispatch = store.dispatch;

const themeActionsTypes = {
  GET_ALL_THEMES: 'GET_ALL_THEMES',
  GET_SELECTED_THEMES: 'GET_SELECTED_THEMES',
  UPDATE_THEME: 'UPDATE_THEME',
  DELETE_THEME: 'DELETE_THEME',
  SET_EDITED_THEME: 'SET_EDITED_THEME',
  SET_EDITED_MODE: 'SET_EDITED_MODE',
  UPDATE_SELECTED_THEMES: 'UPDATE_SELECTED_THEMES',
} as const;

export const themeActionCreator = {
  GET_ALL_THEMES: (themes: Themes) => ({
    type: themeActionsTypes.GET_ALL_THEMES,
    payload: themes,
  }),
  GET_SELECTED_THEMES: (themes: SelectedThemes) => ({
    type: themeActionsTypes.GET_SELECTED_THEMES,
    payload: themes,
  }),
  UPDATE_THEME: (themeName: string, theme: Theme, modeName?: string) => ({
    type: themeActionsTypes.UPDATE_THEME,
    payload: { themeName, theme, modeName },
  }),
  DELETE_THEME: (themeName: string) => ({
    type: themeActionsTypes.DELETE_THEME,
    payload: themeName,
  }),
  SET_EDITED_THEME: (themeName: string) => ({
    type: themeActionsTypes.SET_EDITED_THEME,
    payload: themeName,
  }),
  SET_EDITED_MODE: (modeName: string) => ({
    type: themeActionsTypes.SET_EDITED_MODE,
    payload: modeName,
  }),
  UPDATE_SELECTED_THEMES: (selectedThemes: SelectedThemes) => ({
    type: themeActionsTypes.UPDATE_SELECTED_THEMES,
    payload: selectedThemes,
  }),
};

type ThemeActions<
  A extends keyof typeof themeActionCreator = keyof typeof themeActionCreator,
> = ReturnType<typeof themeActionCreator[A]>;

const themeStateReducer: Reducer<Readonly<ThemesState>, ThemeActions> = u(
  (state: ThemesState, action: ThemeActions) => {
    switch (action.type) {
      case 'GET_ALL_THEMES': {
        state.themes = action.payload;
        break;
      }
      case 'GET_SELECTED_THEMES': {
        state.selectedThemes = action.payload;
        break;
      }
      case 'UPDATE_THEME': {
        state.themes[action.payload.themeName] = action.payload.theme;
        state.editedThemeName = action.payload.themeName;
        if (action.payload.modeName != null) {
          state.editedModeName = action.payload.modeName;
        }
        break;
      }
      case 'DELETE_THEME': {
        // Find previous theme name
        let previousKey = 'default';
        for (const key of Object.keys(state.themes)) {
          if (key !== action.payload) {
            previousKey = key;
          } else {
            break;
          }
        }
        // Set new selected theme
        state.editedThemeName = previousKey;
        // Delete unwanted theme
        delete state.themes[action.payload];
        break;
      }
      case 'SET_EDITED_THEME': {
        if (state.themes[action.payload] != null) {
          state.editedThemeName = action.payload;
        }
        break;
      }
      case 'SET_EDITED_MODE': {
        if (
          state.themes[state.editedThemeName]?.modes[action.payload] != null
        ) {
          state.editedModeName = action.payload;
        }
        break;
      }
      case 'UPDATE_SELECTED_THEMES': {
        state.selectedThemes = action.payload;
        break;
      }
    }
    return state;
  },
  defaultThemesState,
);

const composeEnhancers: typeof compose =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const themeStore = createStore(
  themeStateReducer,
  composeEnhancers(
    applyMiddleware(thunk as ThunkMiddleware<ThemesState, ThemeActions>),
  ),
);

export const { useStore: useThemeStore, getDispatch: getThemeDispatch } =
  createStoreConnector(themeStore);

export function libraryToTheme(library: IGameModelContent) {
  const theme: Theme = JSON.parse(library.content);
  // Updating css classes in browser
  theme.modeClasses = Object.entries(theme.modes).reduce((o, [k, v]) => {
    try {
      modeClass(theme.values, v);
    } catch (e) {
      wwarn(e);
    }

    return { ...o, [k]: modeClass(theme.values, v) };
  }, {});
  return theme;
}

export type ThemeThunkResult<R = void> = ThunkAction<
  R,
  ThemesState,
  undefined,
  ThemeActions
>;

export function getAllThemes(): ThemeThunkResult {
  return function (dispatch) {
    return LibraryAPI.getAllLibraries('Theme')
      .then((libs: ILibraries) => {
        try {
          Object.entries(libs).reduce((o, l) => {
            return { ...o, [l[0]]: libraryToTheme(l[1]) };
          }, {});
        } catch (e) {
          wwarn(e);
        }

        return dispatch(
          themeActionCreator.GET_ALL_THEMES({
            default: defaultTheme,
            trainer: trainerTheme,
            ...Object.entries(libs).reduce((o, l) => {
              const theme: Theme = JSON.parse(l[1].content);
              // Updating css classes in browser
              theme.modeClasses = Object.entries(theme.modes).reduce(
                (o, [k, v]) => ({ ...o, [k]: modeClass(theme.values, v) }),
                {},
              );
              return { ...o, [l[0]]: theme };
            }, {}),
          }),
        );
      })
      .catch((e: Error) => {
        globalDispatch(
          addPopup(
            'getAllThemesError',
            createTranslatableContent(undefined, e.message),
            10000,
          ),
        );
      });
  };
}

export function getSelectedThemes(): ThemeThunkResult {
  return function (dispatch) {
    return LibraryAPI.getAllLibraries('SelectedThemes')
      .then((selectedLibs: ILibraries) => {
        const selectedLib = selectedLibs['SelectedThemes']?.content;
        const selectedThemes = selectedLib ? JSON.parse(selectedLib) : {};
        return dispatch(
          themeActionCreator.GET_SELECTED_THEMES({
            ...defaulSelectedThemes,
            ...selectedThemes,
          }),
        );
      })
      .catch((e: Error) => {
        globalDispatch(
          addPopup(
            'getSelectedThemesError',
            createTranslatableContent(undefined, e.message),
            10000,
          ),
        );
      });
  };
}

export function addNewLib(
  themeName: string,
  theme?: Theme | SelectedThemes,
  modeName?: string,
  libType: ServerLibraryType = 'Theme',
): ThemeThunkResult {
  return function (dispatch, getState) {
    const newTheme = theme
      ? theme
      : getState().themes[getState().editedThemeName];
    return LibraryAPI.addLibrary(
      libType,
      'json',
      themeName,
      JSON.stringify(newTheme),
    ).then((managedResponse: IManagedResponse) => {
      const lib = managedResponse.updatedEntities[0];
      if (entityIs(lib, 'GameModelContent')) {
        if (libType === 'Theme') {
          return dispatch(
            themeActionCreator.UPDATE_THEME(
              themeName,
              JSON.parse(lib.content),
              modeName,
            ),
          );
        } else {
          dispatch(
            themeActionCreator.UPDATE_SELECTED_THEMES(JSON.parse(lib.content)),
          );
        }
      }
      globalDispatch(manageResponseHandler(managedResponse));
    });
  };
}

export function deleteTheme(themeName: string): ThemeThunkResult {
  return function (dispatch) {
    if (themeName === 'default' || themeName === 'trainer') {
      globalDispatch(
        addPopup(
          'deleteThemeError',
          createTranslatableContent(
            undefined,
            `The theme "${themeName}" cannot be deleted`,
          ),
          10000,
        ),
      );
      return;
    } else {
      return LibraryAPI.deleteLibrary('Theme', themeName).then(
        managedResponse => {
          return (
            dispatch(themeActionCreator.DELETE_THEME(themeName)) &&
            globalDispatch(manageResponseHandler(managedResponse))
          );
        },
      );
    }
  };
}

export function setEditedTheme(themeName: string): ThemeThunkResult {
  return function (dispatch) {
    return dispatch(themeActionCreator.SET_EDITED_THEME(themeName));
  };
}

export function setEditedMode(modeName: string): ThemeThunkResult {
  return function (dispatch) {
    return dispatch(themeActionCreator.SET_EDITED_MODE(modeName));
  };
}

function isTheme(test: Theme | SelectedThemes): test is Theme {
  return (
    Object.keys(test).some(el => Object.keys(defaultTheme).includes(el)) &&
    !Object.keys(test).some(el =>
      Object.keys(defaulSelectedThemes).includes(el),
    )
  );
}

function saveLib(
  themeName: string,
  newTheme: Theme | SelectedThemes,
  modeName?: string,
  libType: ServerLibraryType = 'Theme',
): ThemeThunkResult {
  return function (dispatch) {
    return LibraryAPI.getLibrary(libType, themeName)
      .then((lib: IGameModelContent) => {
        const newLib = cloneDeep(lib);
        newLib.content = JSON.stringify(newTheme);
        return LibraryAPI.saveLibrary(libType, themeName, newLib).then(
          managedResponse => {
            const lib = managedResponse.updatedEntities[0];
            if (entityIs(lib, 'GameModelContent')) {
              const newTheme = JSON.parse(lib.content);
              if (isTheme(newTheme)) {
                return dispatch(
                  themeActionCreator.UPDATE_THEME(
                    themeName,
                    newTheme,
                    modeName,
                  ),
                );
              } else {
                return dispatch(
                  themeActionCreator.UPDATE_SELECTED_THEMES(newTheme),
                );
              }
            }
            globalDispatch(manageResponseHandler(managedResponse));
          },
        );
      })
      .catch((e: Error) => {
        if (e.message === NOCONTENTMESSAGE) {
          return dispatch(addNewLib(themeName, newTheme, modeName, libType));
        }
        globalDispatch(
          addPopup(
            'getThemeError',
            createTranslatableContent(undefined, e.message),
            10000,
          ),
        );
      });
  };
}

export function setThemeValue<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
>(themeValueName: T, valueKey: K, value: V | null): ThemeThunkResult {
  return function (dispatch, getState) {
    const state = getState();
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    if (value == null) {
      delete newTheme.values[themeValueName][valueKey];
    } else {
      newTheme.values[themeValueName][valueKey] = value;
    }

    // Recreating modes
    newTheme.modeClasses = Object.entries(newTheme.modes).reduce(
      (o, [k, m]) => ({
        ...o,
        [k]: modeClass(newTheme.values, m),
      }),
      newTheme.modeClasses,
    );

    return dispatch(saveLib(state.editedThemeName, newTheme));
  };
}

export function resetTheme(themeName: string): ThemeThunkResult {
  return function (dispatch) {
    if (Object.keys(defaultThemes).includes(themeName)) {
      return dispatch(saveLib(themeName, defaultThemes[themeName]));
    } else {
      globalDispatch(
        addPopup(
          'resetError',
          createTranslatableContent(
            undefined,
            `You cannot reset a custom theme`,
          ),
          10000,
        ),
      );
      return;
    }
  };
}

export function setBaseMode(modeName: string): ThemeThunkResult {
  return function (dispatch, getState) {
    const state = getState();
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    newTheme.baseMode = modeName;
    return dispatch(saveLib(state.editedThemeName, newTheme));
  };
}

export function addNewMode(modeName: string): ThemeThunkResult {
  return function (dispatch, getState) {
    const state = getState();
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    const currentMode = newTheme.modes[state.editedModeName];
    const newMode = currentMode ? currentMode : defaultLightMode;
    newTheme.modes[modeName] = newMode;
    return dispatch(saveLib(state.editedThemeName, newTheme, modeName));
  };
}

export function deleteMode(modeName: string): ThemeThunkResult {
  return function (dispatch, getState) {
    const state = getState();
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    const baseMode = newTheme.baseMode;
    // Prevent from removing basemode
    if (modeName === baseMode) {
      globalDispatch(
        addPopup(
          'deleteBaseModeError',
          createTranslatableContent(
            undefined,
            'You are not allowed to delete base mode',
          ),
          10000,
        ),
      );
      return;
    }
    let previousKey = baseMode;
    for (const key of Object.keys(newTheme.modes)) {
      if (key !== modeName) {
        previousKey = key;
      } else {
        break;
      }
    }
    // Delete unwanted mode
    delete newTheme.modes[modeName];

    // If mode is used in next mode, remove it
    newTheme.modes = Object.entries(newTheme.modes).reduce((o, [k, m]) => {
      if (m.nextModeName === modeName) {
        return { ...o, [k]: { ...m, nextModeName: previousKey } };
      } else {
        return { ...o, [k]: m };
      }
    }, {});

    return dispatch(saveLib(state.editedThemeName, newTheme, previousKey));
  };
}

export function setModeValue<
  T extends keyof ModeValues,
  K extends keyof ModeValues[T],
  V extends ModeValues[T][K],
>(modeValueName: T, valueKey: K, value: V): ThemeThunkResult {
  return function (dispatch, getState) {
    const state = getState();
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    newTheme.modes[state.editedModeName].values[modeValueName][valueKey] =
      value;

    newTheme.modeClasses[state.editedModeName] = modeClass(
      newTheme.values,
      newTheme.modes[state.editedModeName],
    );

    return dispatch(saveLib(state.editedThemeName, newTheme));
  };
}

export function setNextMode(modeName: string): ThemeThunkResult {
  return function (dispatch, getState) {
    const state = getState();
    const newTheme = cloneDeep(state.themes[state.editedThemeName]);
    newTheme.modes[state.editedModeName].nextModeName = modeName;
    return dispatch(saveLib(state.editedThemeName, newTheme));
  };
}

export function setSelectedTheme(
  themeName: string,
  contextName: keyof SelectedThemes,
): ThemeThunkResult {
  return function (dispatch, getState) {
    const state = getState();
    if (Object.keys(state.themes).includes(themeName)) {
      const newSelectedThemes = cloneDeep(state.selectedThemes);
      newSelectedThemes[contextName] = themeName;
      return dispatch(
        saveLib(
          'SelectedThemes',
          newSelectedThemes,
          undefined,
          'SelectedThemes',
        ),
      );
    } else {
      globalDispatch(
        addPopup(
          'selectThemeError',
          createTranslatableContent(
            undefined,
            'You cannont assign a theme that does not exists',
          ),
          10000,
        ),
      );
    }
  };
}

function themeStoreInit() {
  themeStore.dispatch(getAllThemes());
  themeStore.dispatch(getSelectedThemes());
}
themeStoreInit();
