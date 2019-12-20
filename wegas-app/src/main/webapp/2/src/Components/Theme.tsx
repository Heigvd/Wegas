import * as React from 'react';
import { css } from 'emotion';
import * as Color from 'color';
import { setGlobal, useDispatch } from 'reactn';
import { omit } from 'lodash';
import { wlog } from '../Helper/wegaslog';
import produce from 'immer';

export interface ThemeValues {
  backgroundColor: string;
  primaryColor: string;
  lightTextColor: string;
  darkTextColor: string;
  warningColor: string;
  errorColor: string;
  successColor: string;
  disabledColor: string;
  searchColor: string;
}

export interface ThemeModifiers {
  darker: number;
  lighter: number;
  hover: number;
}

export interface Theme {
  values: ThemeValues;
  modifiers: ThemeModifiers;
}

interface Themes {
  [name: string]: Theme;
}

interface SelectedTheme {
  default: string;
  editor: string;
  player: string;
}

interface ThemesState {
  selectedTheme: SelectedTheme;
  themes: Themes;
}

interface ThemeContextValues<T extends ThemesState> {
  themeState: T;
  // currentSelectedTheme: string;
  // currentValues: ThemeValues;
  // currentModifiers: ThemeModifiers;
  addNewTheme: (themeName: string) => void;
  deleteTheme: (themeName: string) => void;
  setSelectedTheme: (
    themeName: keyof T['themes'],
    contextName: keyof SelectedTheme,
  ) => void;
  setThemeValue: (
    themeName: keyof T['themes'],
    valueName: keyof ThemeValues,
    value: string,
  ) => void;
  setThemeModifer: (
    themeName: keyof T['themes'],
    modifierName: keyof ThemeModifiers,
    value: number,
  ) => void;
  themeRoot?: React.RefObject<HTMLDivElement>;
}

const defaultVars: ThemeValues = {
  backgroundColor: 'white',
  primaryColor: '#1565C0',
  lightTextColor: 'white',
  darkTextColor: '#222',
  warningColor: '#ff9d00',
  errorColor: 'red',
  successColor: '#25f325',
  disabledColor: 'lightgrey',
  searchColor: 'hotpink',
};

const defaultModifiers: ThemeModifiers = {
  darker: 0.3,
  lighter: 0.3,
  hover: 0.6,
};

const defaultThemeState: ThemesState = {
  selectedTheme: {
    default: 'default',
    editor: 'default',
    player: 'default',
  },
  themes: {
    default: {
      values: defaultVars,
      modifiers: defaultModifiers,
    },
  },
};

setGlobal({ themesState: defaultThemeState });

export const themeVar = {
  primaryColor: 'var(--primary-color)',
  primaryTextColor: 'var(--primary-text-color)',
  primaryDarkerColor: 'var(--primary-darker-color)',
  primaryDarkerTextColor: 'var(--primary-darker-text-color)',
  primaryLighterColor: 'var(--primary-lighter-color)',
  primaryLighterTextColor: 'var(--primary-lighter-text-color)',
  primaryHoverColor: 'var(--primary-hover-color)',
  warningColor: 'var(--warning-color)',
  errorColor: 'var(--error-color)',
  successColor: 'var(--success-color)',
  disabledColor: 'var(--disabled-color)',
  backgroundColor: 'var(--background-color)',
  searchColor: 'var(--search-color)',
};
export const primary = css({
  backgroundColor: themeVar.primaryColor,
  color: themeVar.primaryTextColor,
});
export const primaryDark = css({
  backgroundColor: themeVar.primaryDarkerColor,
  color: themeVar.primaryDarkerTextColor,
});
export const primaryLight = css({
  backgroundColor: themeVar.primaryLighterColor,
  color: themeVar.primaryLighterTextColor,
});
export const localSelection = css({
  backgroundColor: themeVar.primaryLighterColor,
});
export const globalSelection = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.primaryDarkerColor,
  borderRadius: '6px',
});
export const searchSelection = css({
  backgroundColor: themeVar.searchColor,
});

export const themeCTX = React.createContext<
  ThemeContextValues<typeof defaultThemeState>
>({
  themeState: defaultThemeState,
  // currentSelectedTheme: defaultThemeState.selectedTheme.default,
  // currentValues: defaultThemeState.themes.default.values,
  // currentModifiers: defaultThemeState.themes.default.modifiers,
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
  setThemeModifer: () => {
    wlog('Not implemented yet');
  },
});

interface ThemeStateActionNewTheme {
  type: 'addNewTheme';
  contextName: keyof SelectedTheme;
  themeName: string;
}

interface ThemeStateActionDeleteTheme<T extends ThemesState> {
  type: 'deleteTheme';
  contextName: keyof SelectedTheme;
  themeName: keyof T['themes'];
}

interface ThemeStateActionSelectTheme<T extends ThemesState> {
  type: 'setSelectedTheme';
  contextName: keyof SelectedTheme;
  themeName: keyof T['themes'];
}

interface ThemeStateActionSetCurrentThemeValue<T extends ThemesState> {
  type: 'setThemeValue';
  themeName: keyof T['themes'];
  valueName: keyof ThemeValues;
  value: string;
}

interface ThemeStateActionSetCurrentThemeModifier<T extends ThemesState> {
  type: 'setThemeModifer';
  themeName: keyof T['themes'];
  modifierName: keyof ThemeModifiers;
  value: number;
}

type ThemeStateAction<T extends ThemesState> =
  | ThemeStateActionNewTheme
  | ThemeStateActionDeleteTheme<T>
  | ThemeStateActionSelectTheme<T>
  | ThemeStateActionSetCurrentThemeValue<T>
  | ThemeStateActionSetCurrentThemeModifier<T>;

const themeStateReducer = <T extends ThemesState>(
  old: T,
  action: ThemeStateAction<T>,
): ThemesState => {
  switch (action.type) {
    case 'addNewTheme':
      return produce(old, draft => {
        draft.themes[action.themeName] = {
          values: defaultVars,
          modifiers: defaultModifiers,
        };
      });
    case 'deleteTheme':
      return produce(old, draft => {
        // Remove theme in the array
        let themes: Themes = omit(
          old.themes,
          action.themeName as keyof typeof old.themes,
        );
        // Verifies no more themes exist
        if (Object.keys(themes).length === 0) {
          themes = {
            default: {
              values: defaultVars,
              modifiers: defaultModifiers,
            },
          };
        }
        // Replace selected theme by new one if no more exists
        Object.keys(draft.selectedTheme).map(
          (k: keyof typeof draft.selectedTheme) => {
            if (draft.selectedTheme[k] === action.themeName) {
              draft.selectedTheme[k] = Object.keys(themes)[0];
            }
          },
        );
        // Set new themes
        draft.themes = themes;
      });
    case 'setSelectedTheme':
      return produce(old, draft => {
        draft.selectedTheme[action.contextName] = String(action.themeName);
      });
    case 'setThemeValue':
      return produce(old, draft => {
        draft.themes[String(action.themeName)].values[action.valueName] =
          action.value;
      });
    case 'setThemeModifer':
      return produce(old, draft => {
        draft.themes[String(action.themeName)].modifiers[action.modifierName] =
          action.value;
      });
  }
};

const { Consumer, Provider } = themeCTX;

export function ThemeProvider({
  children,
  contextName,
}: React.PropsWithChildren<{ contextName: keyof SelectedTheme }>) {
  const themeRoot = React.useRef<HTMLDivElement>(null);
  // const [themes, setGlobalTheme] = useGlobal<{ themesState: ThemesState }>(
  //   'themesState',
  // );
  const [themes, dispatcher] = useDispatch<{ themesState: ThemesState }>(
    themeStateReducer,
    'themesState',
  );
  const dispatchTheme: (
    args: ThemeStateAction<typeof themes>,
  ) => void = dispatcher;
  const currentSelectedTheme = String(themes.selectedTheme[contextName]);
  const currentValues = themes.themes[currentSelectedTheme].values;
  const currentModifiers = themes.themes[currentSelectedTheme].modifiers;

  const bgColor = Color(currentValues.backgroundColor);
  const textColor = bgColor.isLight()
    ? currentValues.darkTextColor
    : currentValues.lightTextColor;
  const primary = Color(currentValues.primaryColor);
  const primText = primary.isLight()
    ? currentValues.darkTextColor
    : currentValues.lightTextColor;
  const primDark = primary.darken(currentModifiers.darker);
  const primDarkText = primDark.isLight()
    ? currentValues.darkTextColor
    : currentValues.lightTextColor;
  const primLight = primary.lighten(currentModifiers.lighter);
  const primLightText = primLight.isLight()
    ? currentValues.darkTextColor
    : currentValues.lightTextColor;
  const primHover = primLight.lighten(currentModifiers.hover);
  return (
    <div
      ref={themeRoot}
      className={css({
        width: '100%',
        height: '100%',
        backgroundColor: currentValues.backgroundColor,
        color: textColor,
        '--primary-color': currentValues.primaryColor,
        '--primary-text-color': primText,
        '--primary-darker-color': primDark.string(),
        '--primary-darker-text-color': primDarkText,
        '--primary-lighter-color': primLight.string(),
        '--primary-lighter-text-color': primLightText,
        '--primary-hover-color': primHover.string(),
        '--warning-color': currentValues.warningColor,
        '--error-color': currentValues.errorColor,
        '--success-color': currentValues.successColor,
        '--disabled-color': currentValues.disabledColor,
        '--background-color': currentValues.backgroundColor,
        '--search-color': currentValues.searchColor,
      })}
    >
      <Provider
        value={{
          // currentValues,
          // currentModifiers,
          // currentSelectedTheme,
          themeState: themes,
          addNewTheme: themeName =>
            dispatchTheme({ type: 'addNewTheme', contextName, themeName }),
          deleteTheme: themeName =>
            dispatchTheme({ type: 'deleteTheme', contextName, themeName }),
          setSelectedTheme: (themeName, contextName) =>
            dispatchTheme({ type: 'setSelectedTheme', contextName, themeName }),
          setThemeModifer: (themeName, modifierName, value) =>
            dispatchTheme({
              type: 'setThemeModifer',
              themeName,
              modifierName,
              value,
            }),
          setThemeValue: (themeName, valueName, value) =>
            dispatchTheme({
              type: 'setThemeValue',
              themeName,
              valueName,
              value,
            }),
          themeRoot,
        }}
      >
        {children}
      </Provider>
    </div>
  );
}
export { Consumer as ThemeRoot };
