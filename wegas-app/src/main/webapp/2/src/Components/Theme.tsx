import * as React from 'react';
import { css } from 'emotion';
import { setGlobal, useDispatch } from 'reactn';
import { omit } from 'lodash';
import { wlog } from '../Helper/wegaslog';
import u from 'immer';

type ColorType = Exclude<React.CSSProperties['color'], undefined>;

export interface ThemeColors {
  'Main color': ColorType;
  'Background color': ColorType;
  'Text color': ColorType;
  'Warning color': ColorType;
  'Error color': ColorType;
  'Sucess color': ColorType;
  'Disabled color': ColorType;
  'Highlight color': ColorType;
  'Hover color': ColorType;
  [color: string]: ColorType;
}

export interface ThemeDimensions {
  'Border radius': React.CSSProperties['borderRadius'];
  [dim: string]: React.CSSProperties[keyof React.CSSProperties];
}

export interface ThemeOthers {
  'Font family': React.CSSProperties['fontFamily'];
  [dim: string]: React.CSSProperties[keyof React.CSSProperties];
}

type ModeColor = keyof ThemeColors;
type ModeDimension = keyof ThemeDimensions;
type ModeOthers = keyof ThemeOthers;

interface ModeComponent<
  C extends { [entry: string]: ModeColor } = {},
  D extends { [entry: string]: ModeDimension } = {},
  O extends { [entry: string]: ModeOthers } = {}
> {
  colors?: C;
  dimensions?: D;
  others?: O;
}

interface Mode {
  Layout: ModeComponent<
    {
      BackgroundColor: ModeColor;
      TextColor: ModeColor;
    },
    {},
    { TextFont: ModeOthers }
  >;
  Button: ModeComponent<
    {
      Color: ModeColor;
      TextColor: ModeColor;
    },
    { Radius: ModeDimension },
    { TextFont: ModeOthers }
  >;
}

type ModeComponentNames = keyof Mode;
type ModeComponents = Mode[ModeComponentNames];
type ModeComponentsSectionNames = keyof ModeComponents;
type ModeComponentsSections = ModeComponents[ModeComponentsSectionNames];

interface Modes {
  normal: Mode;
  [name: string]: Mode;
}

interface ThemeValues {
  colors: ThemeColors;
  dimensions: ThemeDimensions;
  others: ThemeOthers;
}

interface Theme {
  values: ThemeValues;
  // selectedMode: keyof Modes;
  modes: Modes;
}

interface Themes {
  default: Theme;
  [name: string]: Theme;
}

interface SelectedThemes {
  editor: keyof Themes;
  player: keyof Themes;
  survey: keyof Themes;
}

type Context = keyof SelectedThemes;

interface ThemesState {
  selectedThemes: SelectedThemes;
  themes: Themes;
}

interface ThemeContextValues {
  themeState: ThemesState;
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
    section: ModeComponentsSectionNames,
    entry: string,
    value: string | number | undefined,
  ) => void;
  themeRoot?: React.RefObject<HTMLDivElement>;
}

const defaultMode: Mode = {
  Button: {
    colors: {
      Color: 'Main color',
      TextColor: 'Background color',
    },
    dimensions: {
      Radius: 'Border radius',
    },
    others: {
      TextFont: 'Font family',
    },
  },
  Layout: {
    colors: {
      BackgroundColor: 'Background color',
      TextColor: 'Text color',
    },
    others: {
      TextFont: 'Font family',
    },
  },
};

const defaultThemeValues: ThemeValues = {
  colors: {
    'Main color': '#1565C0',
    'Background color': 'white',
    'Text color': 'white',
    'Disabled color': 'lightgrey',
    'Error color': 'red',
    'Highlight color': 'hotpink',
    'Hover color': 'rgba(0x15,0x65,0xC0,0.8)',
    'Warning color': '#ff9d00',
    'Sucess color': 'green',
  },
  dimensions: {
    'Border radius': '5px',
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

const defaultThemeState: ThemesState = {
  selectedThemes: {
    editor: 'default',
    player: 'default',
    survey: 'default',
  },
  themes: defaultThemes,
};

setGlobal({ themesState: defaultThemeState });

export const themeVar: Mode = Object.entries(defaultMode).reduce(
  (o, [ck, c]: [ModeComponentNames, ModeComponents]) => ({
    ...o,
    [ck]: Object.entries(c).reduce(
      (o, [sk, s]: [keyof ThemeValues, ModeComponentsSections]) => ({
        ...o,
        [sk]: Object.keys(s || {}).reduce(
          (o, ek) => ({ ...o, [ek]: `var(--${ck}-${sk}-${ek})`.toLowerCase() }),
          {},
        ),
      }),
      {},
    ),
  }),
  defaultMode,
);

// export const themeVar = {
//   primaryColor: 'var(--primary-color)',
//   primaryTextColor: 'var(--primary-text-color)',
//   primaryDarkerColor: 'var(--primary-darker-color)',
//   primaryDarkerTextColor: 'var(--primary-darker-text-color)',
//   primaryLighterColor: 'var(--primary-lighter-color)',
//   primaryLighterTextColor: 'var(--primary-lighter-text-color)',
//   primaryHoverColor: 'var(--primary-hover-color)',
//   warningColor: 'var(--warning-color)',
//   errorColor: 'var(--error-color)',
//   successColor: 'var(--success-color)',
//   disabledColor: 'var(--disabled-color)',
//   backgroundColor: 'var(--background-color)',
//   searchColor: 'var(--search-color)',
//   borderRadius: 'var(--border-radius)',
// };

// export const primary = css({
//   backgroundColor: themeVar.primaryColor,
//   color: themeVar.primaryTextColor,
// });
// export const primaryDark = css({
//   backgroundColor: themeVar.primaryDarkerColor,
//   color: themeVar.primaryDarkerTextColor,
// });
// export const primaryLight = css({
//   backgroundColor: themeVar.primaryLighterColor,
//   color: themeVar.primaryLighterTextColor,
// });
// export const localSelection = css({
//   backgroundColor: themeVar.primaryLighterColor,
// });
// export const globalSelection = css({
//   borderStyle: 'solid',
//   borderWidth: '2px',
//   borderColor: themeVar.primaryDarkerColor,
//   borderRadius: themeVar.borderRadius,
// });
// export const searchSelection = css({
//   backgroundColor: themeVar.searchColor,
// });

export const themeCTX = React.createContext<ThemeContextValues>({
  themeState: defaultThemeState,
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
        const psection = oldState.themes[themeName].modes[modeName][component][
          section
        ] as { [id: string]: any };
        if (psection != null && entry in psection) {
          psection[entry] = value;
          // oldState.themes[themeName].modes[modeName][component][section][entry] = value;
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
  // const themeRoot = React.useRef<HTMLDivElement>(null);
  const [themesState, dispatcher] = useDispatch<{ themesState: ThemesState }>(
    themeStateReducer,
    'themesState',
  );
  const dispatchTheme: (args: ThemeStateAction) => void = dispatcher;

  const currentTheme =
    themesState.themes[themesState.selectedThemes[contextName]];
  const currentMode =
    modeName == null || currentTheme.modes[modeName] == null
      ? currentTheme.modes.normal
      : currentTheme.modes[modeName];
  const nodeVars = Object.entries(currentMode).reduce(
    (o, [ck, c]: [ModeComponentNames, ModeComponents]) => ({
      ...o,
      ...Object.entries(c).reduce(
        (o, [sk, s]: [keyof ThemeValues, ModeComponentsSections]) => ({
          ...o,
          ...Object.entries(s || {}).reduce(
            (o, [ek, e]: [string, ModeColor | ModeDimension | ModeOthers]) => ({
              ...o,
              [`--${ck}-${sk}-${ek}`.toLowerCase()]: currentTheme.values[sk][e],
            }),
            {},
          ),
        }),
        {},
      ),
    }),
    {},
  );
  css(nodeVars);

  debugger;

  return (
    <div
    // ref={themeRoot}
    // className={css({
    //   // width: '100%',
    //   // height: '100%',
    //   // overflow: 'auto',
    //   flex: '1 1 auto',
    //   backgroundColor: currentValues.backgroundColor,
    //   color: textColor,
    //   '--primary-color': currentValues.primaryColor,
    //   '--primary-text-color': primText,
    //   '--primary-darker-color': primDark.string(),
    //   '--primary-darker-text-color': primDarkText,
    //   '--primary-lighter-color': primLight.string(),
    //   '--primary-lighter-text-color': primLightText,
    //   '--primary-hover-color': primHover.string(),
    //   '--warning-color': currentValues.warningColor,
    //   '--error-color': currentValues.errorColor,
    //   '--success-color': currentValues.successColor,
    //   '--disabled-color': currentValues.disabledColor,
    //   '--background-color': currentValues.backgroundColor,
    //   '--search-color': currentValues.searchColor,
    //   '--border-radius': currentEntries.borderRadius,
    // })}
    // className={css(nodeVars)}
    >
      <Provider
        value={{
          themeState: themesState,
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
