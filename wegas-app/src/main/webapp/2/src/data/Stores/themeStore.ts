import { createStore, applyMiddleware, Reducer } from 'redux';
import { composeEnhancers } from './store';
import thunk, { ThunkAction, ThunkMiddleware } from 'redux-thunk';
import { createStoreConnector } from '../connectStore';
import u from 'immer';
import {
  defaultTheme,
  Theme,
  trainerTheme,
} from '../../Components/Style/Theme';
import { LibraryAPI, ILibraries } from '../../API/library.api';
import { addPopup, popupDispatch } from '../../Components/PopupManager';
import { createTranslatableContent } from '../../Editor/Components/FormView/translatable';
import { IGameModelContent } from 'wegas-ts-api';

interface Themes {
  default: Theme;
  trainer: Theme;
  [themeName: string]: Theme;
}

interface SelectedThemes {
  editor: string;
  player: string;
  survey: string;
  trainer: string;
}

export interface ThemesState {
  selectedThemes: SelectedThemes;
  themes: Themes;
}

const defaultThemes: Themes = {
  default: defaultTheme,
  trainer: trainerTheme,
};

const defaulSelectedThemes: SelectedThemes = {
  editor: 'default',
  player: 'default',
  survey: 'default',
  trainer: 'trainer',
};

const defaultThemesState: ThemesState = {
  selectedThemes: defaulSelectedThemes,
  themes: defaultThemes,
};

const themeActionsTypes = {
  GET_ALL_THEMES: 'GET_ALL_THEMES',
  GET_SELECTED_THEMES: 'GET_SELECTED_THEMES',
  ADD_NEW_THEME: 'ADD_NEW_THEME',
  DELETE_THEME: 'DELETE_THEME',
} as const;

const themeActionCreator = {
  GET_ALL_THEMES: (themes: Themes) => ({
    type: themeActionsTypes.GET_ALL_THEMES,
    payload: themes,
  }),
  GET_SELECTED_THEMES: (themes: SelectedThemes) => ({
    type: themeActionsTypes.GET_SELECTED_THEMES,
    payload: themes,
  }),
  ADD_NEW_THEME: (themeName: string, theme: Theme) => ({
    type: themeActionsTypes.ADD_NEW_THEME,
    payload: { themeName, theme },
  }),
  DELETE_THEME: (themeName: string) => ({
    type: themeActionsTypes.DELETE_THEME,
    payload: themeName,
  }),
};

type ThemeActions<
  A extends keyof typeof themeActionCreator = keyof typeof themeActionCreator
> = ReturnType<typeof themeActionCreator[A]>;

export const themeStateAction = {
  getAllThemes: (themes: Themes) => themeActionCreator.GET_ALL_THEMES(themes),
  getSelectedThemes: (selectedThemes: SelectedThemes) =>
    themeActionCreator.GET_SELECTED_THEMES(selectedThemes),
  addNewTheme: (themeName: string, theme: Theme) =>
    themeActionCreator.ADD_NEW_THEME(themeName, theme),
  deleteTheme: (themeName: string) =>
    themeActionCreator.DELETE_THEME(themeName),
};

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
      case 'ADD_NEW_THEME': {
        state.themes[action.payload.themeName] = action.payload.theme;
        break;
      }
      case 'DELETE_THEME': {
        delete state.themes[action.payload];
        break;
      }
    }
    return state;
  },
  defaultThemesState,
);

export const themeStore = createStore(
  themeStateReducer,
  composeEnhancers(
    applyMiddleware(thunk as ThunkMiddleware<ThemesState, ThemeActions>),
  ),
);

export const {
  useStore: useThemeStore,
  getDispatch: getThemeDispatch,
} = createStoreConnector(themeStore);

export type ThemeThunkResult<R = void> = ThunkAction<
  R,
  ThemesState,
  undefined,
  ThemeActions
>;

export type ThemeStoreDispatch = typeof themeStore.dispatch;

export function getAllThemes(): ThemeThunkResult {
  return function (dispatch) {
    return LibraryAPI.getAllLibraries('Theme')
      .then((libs: ILibraries) => {
        debugger;
        return dispatch(
          themeStateAction.getAllThemes({
            default: defaultTheme,
            trainer: trainerTheme,
            ...Object.entries(libs).reduce(
              (o, l) => ({ ...o, [l[0]]: JSON.parse(l[1].content) }),
              {},
            ),
          }),
        );
      })
      .catch((e: Error) => {
        popupDispatch(
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
      .then((libs: ILibraries) => {
        const test = JSON.parse(Object.values(libs)[0].content);
        debugger;
        return dispatch(
          themeStateAction.getSelectedThemes({
            ...defaulSelectedThemes,
            ...JSON.parse(Object.values(libs)[0].content),
          }),
        );
      })
      .catch((e: Error) => {
        popupDispatch(
          addPopup(
            'getSelectedThemesError',
            createTranslatableContent(undefined, e.message),
            10000,
          ),
        );
      });
  };
}

export function addNewTheme(themeName: string): ThemeThunkResult {
  return function (dispatch, getState) {
    const newTheme = getState().themes.default;
    return LibraryAPI.addLibrary(
      'SelectedThemes',
      'json',
      themeName,
      JSON.stringify(newTheme),
    )
      .then((lib: IGameModelContent) => {
        return dispatch(
          themeStateAction.addNewTheme(themeName, JSON.parse(lib.content)),
        );
      })
      .catch((e: Error) => {
        popupDispatch(
          addPopup(
            'addNewThemeError',
            createTranslatableContent(undefined, e.message),
            10000,
          ),
        );
      });
  };
}

export function deleteTheme(themeName: string): ThemeThunkResult {
  return function (dispatch) {
    if (themeName === 'default' || themeName === 'trainer') {
      popupDispatch(
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
      return LibraryAPI.deleteLibrary('Theme', themeName)
        .then(() => {
          return dispatch(themeStateAction.deleteTheme(themeName));
        })
        .catch((e: Error) => {
          popupDispatch(
            addPopup(
              'deleteThemeError',
              createTranslatableContent(undefined, e.message),
              10000,
            ),
          );
        });
    }
  };
}

function themeStoreInit() {
  themeStore.dispatch(getAllThemes());
}
themeStoreInit();

// export function isComponentFocused(
//   editMode: boolean,
//   pageId: string,
//   componentPath: number[],
// ) {
//   return ({ focusedComponent }: ThemeState) =>
//     (editMode &&
//       focusedComponent &&
//       focusedComponent.pageId === pageId &&
//       JSON.stringify(focusedComponent.componentPath) ===
//         JSON.stringify(componentPath)) === true;
// }
