import * as React from 'react';
import { css, cx } from 'emotion';
import { setGlobal, useDispatch } from 'reactn';
import { omit } from 'lodash';
import { wlog } from '../../Helper/wegaslog';
import u from 'immer';
import {
  Mode,
  defaultLightMode,
  defaultDarkMode,
  DefaultThemeColors,
  DefaultThemeDimensions,
  DefaultThemeOthers,
  ModeComponentNames,
  FullModeComponent,
  ModeColor,
  ModeDimension,
  ModeOther,
  ModeComponent,
} from './ThemeVars';
import { layoutStyle, expandBoth } from '../../css/classes';

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

interface ModeClasses {
  light: string;
  dark: string;
  [name: string]: string;
}

interface Modes {
  light: Mode;
  dark: Mode;
  [name: string]: Mode;
}

export interface ThemeValues {
  colors: ThemeColors;
  dimensions: ThemeDimensions;
  others: ThemeOthers;
}

export interface Theme {
  values: ThemeValues;
  baseMode: string;
  modes: Modes;
  modeClasses: ModeClasses;
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

export interface ThemeComponent {
  modeName?: string;
}

export type ThemeContext = keyof SelectedThemes;

interface ThemesState {
  selectedThemes: SelectedThemes;
  themes: Themes;
}

interface ThemeContextValues {
  themesState: ThemesState;
  currentContext: ThemeContext;
  addNewTheme: (themeName: string) => void;
  deleteTheme: (themeName: string) => void;
  addNewMode: (themeName: string, modeName: string) => void;
  deleteMode: (themeName: string, modeName: string) => void;
  setSelectedTheme: (themeName: string, contextName: ThemeContext) => void;
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
    value: string,
  ) => void;
  setBaseMode: (themeName: string, baseNode: string) => void;
  themeRoot?: React.RefObject<HTMLDivElement>;
}

export const defaultThemeValues: ThemeValues = {
  colors: {
    'Main color': '#1565C0',
    'Secondary color': '#00499c',
    'Background color': 'white',
    'Secondary background color': 'rgba(208,224,243,1.0)',
    'Text color': '#1565C0',
    'Secondary text color': 'white',
    'Disabled color': 'lightgrey',
    'Error color': 'red',
    'Highlight color': 'hotpink',
    'Hover color': 'rgba(208,224,243,1.0)',
    'Warning color': '#ff9d00',
    'Success color': 'green',
    'Header color': 'rgba(208,224,243,1.0)',
  },
  dimensions: {
    'Border radius': '5px',
    'Border width': '5px',
    'Font size 1': '2em',
    'Font size 2': '1.75em',
    'Font size 3': '1.5em',
    'Font size 4': '1.25em',
    'Font size 5': '1.25em',
  },
  others: {
    'Font family 1': '"Courier New"',
    'Font family 2': '"Montserrat"',
    'Font family 3': '"Arial"',
  },
};

const defaultTheme: Theme = {
  values: defaultThemeValues,
  modes: { light: defaultLightMode, dark: defaultDarkMode },
  modeClasses: {
    light: modeClass(defaultThemeValues, defaultLightMode),
    dark: modeClass(defaultThemeValues, defaultDarkMode),
  },
  baseMode: 'light',
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
  addNewMode: () => {
    wlog('Not implemented yet');
  },
  deleteMode: () => {
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
  setBaseMode: () => {
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

interface ThemeStateActionNewMode {
  type: 'addNewMode';
  themeName: string;
  modeName: string;
}

interface ThemeStateActionDeleteMode {
  type: 'deleteMode';
  themeName: string;
  modeName: string;
}

interface ThemeStateActionSelectTheme {
  type: 'setSelectedTheme';
  contextName: ThemeContext;
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
  component: ModeComponentNames;
  section: keyof ThemeValues;
  entry: string;
  value: string | number | undefined;
}

interface ThemeStateActionSetBaseMode {
  type: 'setBaseMode';
  themeName: string;
  modeName: string;
}

type ThemeStateAction =
  | ThemeStateActionNewTheme
  | ThemeStateActionDeleteTheme
  | ThemeStateActionNewMode
  | ThemeStateActionDeleteMode
  | ThemeStateActionSelectTheme
  | ThemeStateActionSetThemeValue
  | ThemeStateActionSetModeValue
  | ThemeStateActionSetBaseMode;

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
              oldState.selectedThemes[context as ThemeContext] ===
              action.themeName
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
      case 'addNewMode': {
        const oldTheme = oldState.themes[action.themeName];
        if (oldTheme != null) {
          oldTheme.modes = {
            [action.modeName]: defaultLightMode,
            ...oldTheme.modes,
          };
          oldTheme.modeClasses = {
            [action.modeName]: modeClass(oldTheme.values, defaultLightMode),
            ...oldTheme.modeClasses,
          };
        }
        break;
      }
      case 'deleteMode': {
        const oldTheme = oldState.themes[action.themeName];
        if (oldTheme != null && action.modeName !== 'normal') {
          oldTheme.modes = omit(oldTheme.modes, action.modeName) as Modes;
          oldTheme.modeClasses = omit(
            oldTheme.modeClasses,
            action.modeName,
          ) as ModeClasses;
        }
        break;
      }
      case 'setSelectedTheme': {
        oldState.selectedThemes[action.contextName] = action.themeName;
        break;
      }
      case 'setThemeValue': {
        const { themeName, section, entry, value } = action;
        const oldTheme = oldState.themes[themeName];
        if (value === null) {
          const psection = oldTheme.values[section];
          if (!Object.keys(defaultTheme.values[section]).includes(entry)) {
            oldTheme.values[section] = omit(psection, entry) as ThemeColors &
              ThemeDimensions &
              ThemeOthers;
          }
        } else {
          oldTheme.values[section][entry] = value;
        }
        // Recreating modes
        oldTheme.modeClasses = Object.entries(oldTheme.modes).reduce(
          (o, [k, m]) => ({
            ...o,
            [k]: modeClass(oldTheme.values, m),
          }),
          oldTheme.modeClasses,
        );
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
        const oldTheme = oldState.themes[themeName];
        const oldMode = oldTheme.modes[modeName];
        const psection = (oldMode.values[component] as FullModeComponent)[
          section
        ];
        if (psection != null && entry in psection) {
          psection[entry] = value as ModeColor | ModeDimension | ModeOther;
          oldTheme.modeClasses[modeName] = modeClass(oldTheme.values, oldMode);
        }
        break;
      }
      case 'setBaseMode': {
        oldState.themes[action.themeName].baseMode = action.modeName;
        break;
      }
    }
  });

const { Consumer, Provider } = themeCTX;

export function ThemeProvider({
  children,
  contextName,
  modeName,
}: React.PropsWithChildren<{ contextName: ThemeContext } & ThemeComponent>) {
  const themeRoot = React.useRef<HTMLDivElement>(null);
  const [themesState, dispatcher] = useDispatch<{ themesState: ThemesState }>(
    themeStateReducer,
    'themesState',
  );
  const dispatchTheme: (args: ThemeStateAction) => void = dispatcher;

  const className = themeModeClass(themesState, contextName, modeName);

  return (
    <div ref={themeRoot} className={cx(className, layoutStyle, expandBoth)}>
      <Provider
        value={{
          themesState: themesState,
          addNewTheme: themeName =>
            dispatchTheme({ type: 'addNewTheme', themeName }),
          deleteTheme: themeName =>
            dispatchTheme({ type: 'deleteTheme', themeName }),
          addNewMode: (themeName, modeName) =>
            dispatchTheme({ type: 'addNewMode', themeName, modeName }),
          deleteMode: (themeName, modeName) =>
            dispatchTheme({ type: 'deleteMode', themeName, modeName }),
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
          setBaseMode: (themeName, modeName) =>
            dispatchTheme({ type: 'setBaseMode', themeName, modeName }),
          currentContext: contextName,
          themeRoot,
        }}
      >
        {children}
      </Provider>
    </div>
  );
}
export { Consumer as ThemeRoot };

function modeClass(themeValues: ThemeValues, mode: Mode): string {
  return css({
    '--current-mode-name': mode.modeName,
    '--next-mode-name': mode.nextModeName,
    ...Object.entries(mode.values).reduce(
      (o, [ck, c]) => ({
        ...o,
        ...Object.entries(c).reduce(
          (o, [sk, s]) => ({
            ...o,
            ...Object.entries((s as {}) || {}).reduce(
              (o, [ek, e]) => ({
                ...o,
                [`--${ck}-${sk}-${ek}`.toLowerCase()]:
                  themeValues[sk as keyof ThemeValues][e as string] ||
                  themeValues[sk as keyof ThemeValues][
                    defaultLightMode.values[ck as ModeComponentNames][
                      sk as keyof ModeComponent
                    ][ek] as string
                  ],
              }),
              {},
            ),
          }),
          {},
        ),
      }),
      {},
    ),
  });
}

function themeModeClass(
  themesState: ThemesState,
  contextName: ThemeContext,
  modeName?: string,
) {
  const currentTheme =
    themesState.themes[themesState.selectedThemes[contextName]];
  const computedModeName = modeName ? modeName : currentTheme.baseMode;
  return currentTheme.modeClasses[computedModeName];
}

/**
 * useModeClass - a hook that returns the selector for defining mode variables
 * @param modeName The name of the mode
 * @returns  the selector of the rule containing mode variables or an empty string if modeName is undefined
 */
export function useModeClass(modeName: string | undefined) {
  const { themesState, currentContext } = React.useContext(themeCTX);
  const currentTheme =
    themesState.themes[themesState.selectedThemes[currentContext]];
  return modeName ? currentTheme.modeClasses[modeName] : '';
}

/**
 * useModeSwitch - a hook that allows switching to next mode
 * @param modeName The name of the targeted mode
 * @param children The React children node
 * @returns currentModeClassName: the className for current mode rules.
 *          childrenModeClassName: the className for the children mode rules.
 *          childrenNode: the new children node that must be used instead of the one given in the functions.
 *          switcher: a switcher that must be placed in the ref prop of a DivElement.
 */
export function useModeSwitch(
  modeName: string | undefined,
  children: React.ReactNode,
) {
  const { themesState, currentContext } = React.useContext(themeCTX);
  const currentTheme =
    themesState.themes[themesState.selectedThemes[currentContext]];
  const [
    { currentModeName, nextModeName },
    setCurrentModeNames,
  ] = React.useState<{
    currentModeName?: string;
    nextModeName?: string;
  }>({});

  const [
    currentModeClassName,
    childrenModeClassName,
    childrenNode,
  ] = React.useMemo(() => {
    const modeClassName = modeName
      ? currentTheme.modeClasses[modeName]
      : currentModeName
      ? currentTheme.modeClasses[currentModeName]
      : undefined;
    const nextModeClassName = modeName
      ? currentTheme.modeClasses[currentTheme.modes[modeName].nextModeName]
      : nextModeName
      ? currentTheme.modeClasses[nextModeName]
      : undefined;

    const currentClassName = modeClassName
      ? css({
          '&&': modeClassName,
        })
      : undefined;
    const childrenClassName = nextModeClassName
      ? css({
          '& *': nextModeClassName,
        })
      : undefined;
    return [
      currentClassName,
      childrenClassName,
      React.Children.map(children, (c, i) => (
        <React.Fragment key={childrenClassName || '' + i}>{c}</React.Fragment>
      )),
    ];
  }, [currentModeName, nextModeName, currentTheme, modeName, children]);

  const switcher = React.useCallback(
    (ref: HTMLElement | null) => {
      if (ref) {
        const newCurrentModeName = getComputedStyle(ref).getPropertyValue(
          '--current-mode-name',
        );
        const newNextModeName = getComputedStyle(ref).getPropertyValue(
          '--next-mode-name',
        );

        if (
          newCurrentModeName !== currentModeName ||
          newNextModeName !== nextModeName
        ) {
          setCurrentModeNames({
            currentModeName: newCurrentModeName,
            nextModeName: newNextModeName,
          });
        }
      }
    },
    [currentModeName, nextModeName],
  );

  return {
    currentModeClassName,
    childrenModeClassName,
    childrenNode,
    switcher,
  };
}
