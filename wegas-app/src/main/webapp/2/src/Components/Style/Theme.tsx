import * as React from 'react';
import { css } from 'emotion';
import { setGlobal, useDispatch } from 'reactn';
import { omit } from 'lodash';
import { wlog } from '../../Helper/wegaslog';
import u from 'immer';
import {
  Mode,
  defaultMode,
  DefaultThemeColors,
  DefaultThemeDimensions,
  DefaultThemeOthers,
  ModeComponentNames,
  FullModeComponent,
  ModeColor,
  ModeDimension,
  ModeOther,
} from './ThemeVars';

export type ColorType = Exclude<React.CSSProperties['color'], undefined>;

interface ThemeColors extends DefaultThemeColors {
  [color: string]: ColorType;
}

interface ThemeDimensions extends DefaultThemeDimensions {
  [dim: string]: React.CSSProperties[keyof React.CSSProperties];
}

interface ThemeOthers extends DefaultThemeOthers {
  [dim: string]: React.CSSProperties[keyof React.CSSProperties];
}

interface Modes {
  normal: Mode;
  [name: string]: Mode;
}

interface ThemeValues {
  colors: ThemeColors;
  dimensions: ThemeDimensions;
  others: ThemeOthers;
}

export interface Theme {
  values: ThemeValues;
  // selectedMode: keyof Modes;
  modes: Modes;
}

interface Themes {
  default: Theme;
  [name: string]: Theme;
}

interface SelectedThemes {
  editor: string;
  player: string;
  survey: string;
}

type Context = keyof SelectedThemes;

interface ThemesState {
  selectedThemes: SelectedThemes;
  themes: Themes;
}

interface ThemeContextValues {
  themesState: ThemesState;
  currentContext: Context;
  addNewTheme: (themeName: string) => void;
  deleteTheme: (themeName: string) => void;
  setSelectedTheme: (themeName: string, contextName: Context) => void;
  setThemeValue: (
    themeName: string,
    section: keyof ThemeValues,
    entry: string,
    value: string | number | undefined | null,
  ) => void;
  setModeValue: (
    themeName: string,
    modeName: string,
    component: ModeComponentNames,
    section: keyof ThemeValues,
    entry: string,
    value: string | number | undefined,
  ) => void;
  themeRoot?: React.RefObject<HTMLDivElement>;
}

const defaultThemeValues: ThemeValues = {
  colors: {
    'Main color': '#1565C0',
    'Secondary color': '#00499c',
    'Background color': 'white',
    'Text color': '#1565C0',
    'Secondary text color': 'white',
    'Disabled color': 'lightgrey',
    'Error color': 'red',
    'Highlight color': 'hotpink',
    'Hover color': 'rgba(21,101,192,0.2)',
    'Warning color': '#ff9d00',
    'Success color': 'green',
  },
  dimensions: {
    'Border radius': '5px',
    'Border width': '5px',
  },
  others: {
    'Font family': 'arial',
  },
};

const defaultTheme = {
  values: defaultThemeValues,
  modes: { normal: defaultMode },
  selectedMode: 'normal',
};

const defaultThemes = {
  default: defaultTheme,
};

const defaultThemesState: ThemesState = {
  selectedThemes: {
    editor: 'default',
    player: 'default',
    survey: 'default',
  },
  themes: defaultThemes,
};

setGlobal({ themesState: defaultThemesState });

export const themeCTX = React.createContext<ThemeContextValues>({
  themesState: defaultThemesState,
  addNewTheme: () => {
    wlog('Not implemented yet');
  },
  deleteTheme: () => {
    wlog('Not implemented yet');
  },
  setSelectedTheme: () => {
    wlog('Not implemented yet');
  },
  setThemeValue: () => {
    wlog('Not implemented yet');
  },
  setModeValue: () => {
    wlog('Not implemented yet');
  },
  currentContext: 'editor',
});

interface ThemeStateActionNewTheme {
  type: 'addNewTheme';
  themeName: string;
}

interface ThemeStateActionDeleteTheme {
  type: 'deleteTheme';
  themeName: string;
}

interface ThemeStateActionSelectTheme {
  type: 'setSelectedTheme';
  contextName: Context;
  themeName: string;
}

interface ThemeStateActionSetThemeValue {
  type: 'setThemeValue';
  themeName: string;
  section: keyof ThemeValues;
  entry: string;
  value: string | number | undefined | null;
}

interface ThemeStateActionSetModeValue {
  type: 'setModeValue';
  themeName: string;
  modeName: string;
  component: keyof Mode;
  section: keyof ThemeValues;
  entry: string;
  value: string | number | undefined;
}

type ThemeStateAction =
  | ThemeStateActionNewTheme
  | ThemeStateActionDeleteTheme
  | ThemeStateActionSelectTheme
  | ThemeStateActionSetThemeValue
  | ThemeStateActionSetModeValue;

const themeStateReducer = (
  oldState: ThemesState,
  action: ThemeStateAction,
): ThemesState =>
  u(oldState, oldState => {
    switch (action.type) {
      case 'addNewTheme': {
        oldState.themes = {
          [action.themeName]: defaultTheme,
          ...oldState.themes,
        };
        break;
      }
      case 'deleteTheme': {
        if (action.themeName !== 'default') {
          for (const context in oldState.selectedThemes) {
            if (
              oldState.selectedThemes[context as Context] === action.themeName
            ) {
              oldState.selectedThemes = {
                ...oldState.selectedThemes,
                [context]: 'default',
              };
            }
          }
          oldState.themes = omit(oldState.themes, action.themeName) as Themes;
        }
        break;
      }
      case 'setSelectedTheme': {
        oldState.selectedThemes[action.contextName] = action.themeName;
        break;
      }
      case 'setThemeValue': {
        const { themeName, section, entry, value } = action;
        if (value === null) {
          const psection = oldState.themes[themeName].values[section];
          if (!Object.keys(defaultTheme.values[section]).includes(entry)) {
            oldState.themes[themeName].values[section] = omit(
              psection,
              entry,
            ) as ThemeColors & ThemeDimensions & ThemeOthers;
          }
        } else {
          oldState.themes[themeName].values[section][entry] = value;
        }
        break;
      }
      case 'setModeValue': {
        const {
          themeName,
          modeName,
          component,
          section,
          entry,
          value,
        } = action;
        const psection = (oldState.themes[themeName].modes[modeName][
          component
        ] as FullModeComponent)[section];
        if (psection != null && entry in psection) {
          psection[entry] = value as ModeColor | ModeDimension | ModeOther;
        }
      }
    }
  });

const { Consumer, Provider } = themeCTX;

export function ThemeProvider({
  children,
  contextName,
  modeName,
}: React.PropsWithChildren<{ contextName: Context; modeName?: string }>) {
  const themeRoot = React.useRef<HTMLDivElement>(null);
  const [themesState, dispatcher] = useDispatch<{ themesState: ThemesState }>(
    themeStateReducer,
    'themesState',
  );
  const dispatchTheme: (args: ThemeStateAction) => void = dispatcher;

  const nodeVars = themeVariables(themesState, contextName, modeName);

  return (
    <div ref={themeRoot} className={css(nodeVars)}>
      <Provider
        value={{
          themesState: themesState,
          addNewTheme: themeName =>
            dispatchTheme({ type: 'addNewTheme', themeName }),
          deleteTheme: themeName =>
            dispatchTheme({ type: 'deleteTheme', themeName }),
          setSelectedTheme: (themeName, contextName) =>
            dispatchTheme({ type: 'setSelectedTheme', contextName, themeName }),
          setThemeValue: (themeName, section, entry, value) =>
            dispatchTheme({
              type: 'setThemeValue',
              themeName,
              section,
              entry,
              value,
            }),
          setModeValue: (
            themeName,
            modeName,
            component,
            section,
            entry,
            value,
          ) =>
            dispatchTheme({
              type: 'setModeValue',
              themeName,
              modeName,
              component,
              section,
              entry,
              value,
            }),
          currentContext: contextName,
        }}
      >
        {children}
      </Provider>
    </div>
  );
}
export { Consumer as ThemeRoot };

function themeVariables(
  themesState: ThemesState,
  contextName: Context,
  modeName?: string,
) {
  const currentTheme =
    themesState.themes[themesState.selectedThemes[contextName]];
  const currentMode =
    modeName == null || currentTheme.modes[modeName] == null
      ? currentTheme.modes.normal
      : currentTheme.modes[modeName];
  return Object.entries(currentMode).reduce(
    (o, [ck, c]) => ({
      ...o,
      ...Object.entries(c).reduce(
        (o, [sk, s]) => ({
          ...o,
          ...Object.entries((s as {}) || {}).reduce(
            (o, [ek, e]) => ({
              ...o,
              [`--${ck}-${sk}-${ek}`.toLowerCase()]: currentTheme.values[
                sk as keyof ThemeValues
              ][e as string],
            }),
            {},
          ),
        }),
        {},
      ),
    }),
    {},
  );
}

export function useThemeModeVariables(modeName: string) {
  const { themesState, currentContext } = React.useContext(themeCTX);
  return themeVariables(themesState, currentContext, modeName);
}
