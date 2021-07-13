import { css } from 'emotion';

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
  [name: string]: string;
}

interface Modes {
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

export interface DefaultThemeColors {
  'Primary color': ColorType;
  'Primary color shade': ColorType;
  'Primary color tint': ColorType;
  'Primary color pastel': ColorType;
  'Secondary color': ColorType;
  'Secondary color shade': ColorType;
  'Secondary color tint': ColorType;
  'Secondary color pastel': ColorType;
  'Accent color': ColorType;
  'Background color': ColorType;
  'Secondary background color': ColorType;
  'Dark background color': ColorType;
  'Dark secondary background color': ColorType;
  'Text color': ColorType;
  'Secondary text color': ColorType;
  'Disabled color': ColorType;
  'Error color': ColorType;
  'Warning color': ColorType;
  'Success color': ColorType;
}

// Not the best but allows to split colors into logical groups without modifying the theme's structure
export const primaryColorsSection = {
  'Primary color': 'main',
  'Primary color shade': 'shade',
  'Primary color tint': 'tint',
  'Primary color pastel': 'pastel',
};
export const secondaryColorsSection = {
  'Secondary color': 'main',
  'Secondary color shade': 'shade',
  'Secondary color tint': 'tint',
  'Secondary color pastel': 'pastel',
};
export const backgroundColorsSection = {
  'Background color': 'main',
  'Secondary background color': 'secondary',
  'Dark background color': 'dark',
  'Dark secondary background color': 'dark secondary',
};
export const textColorsSection = {
  'Text color': 'main',
  'Secondary text color': 'secondary',
};

export interface DefaultThemeDimensions {
  'Border radius': React.CSSProperties['borderRadius'];
  'Border width': React.CSSProperties['borderWidth'];
  'Font size 1': React.CSSProperties['fontSize'];
  'Font size 2': React.CSSProperties['fontSize'];
  'Font size 3': React.CSSProperties['fontSize'];
  'Font size 4': React.CSSProperties['fontSize'];
  'Font size 5': React.CSSProperties['fontSize'];
}

export interface DefaultThemeOthers {
  'Font family 1': React.CSSProperties['fontFamily'];
  'Font family 2': React.CSSProperties['fontFamily'];
  'Font family 3': React.CSSProperties['fontFamily'];
}

export type ModeColor = keyof DefaultThemeColors | undefined;
export type ModeDimension = keyof DefaultThemeDimensions | undefined;
export type ModeOther = keyof DefaultThemeOthers | undefined;

export type ModeComponent<
  C extends { [entry: string]: ModeColor } | undefined = undefined,
  D extends { [entry: string]: ModeDimension } | undefined = undefined,
  O extends { [entry: string]: ModeOther } | undefined = undefined,
> = {} & (C extends undefined
  ? {}
  : {
      colors: C;
    }) &
  (D extends undefined
    ? {}
    : {
        dimensions: D;
      }) &
  (O extends undefined
    ? {}
    : {
        others: O;
      });

export type FullModeComponent = ModeComponent<
  { [entry: string]: ModeColor },
  { [entry: string]: ModeDimension },
  { [entry: string]: ModeOther }
>;

export type ModeValues = ModeComponent<
  {
    PrimaryColor: ModeColor;
    PrimaryColorShade: ModeColor;
    ActiveColor: ModeColor;
    BackgroundColor: ModeColor;
    SecondaryBackgroundColor: ModeColor;
    DarkTextColor: ModeColor;
    LightTextColor: ModeColor;
    DisabledColor: ModeColor;
    HighlightColor: ModeColor;
    HeaderColor: ModeColor;
    HoverColor: ModeColor;
    HoverTextColor: ModeColor;
    WarningColor: ModeColor;
    SuccessColor: ModeColor;
    ErrorColor: ModeColor;
  },
  { BorderWidth: ModeDimension; BorderRadius: ModeDimension },
  { TextFont1: ModeOther; TextFont2: ModeOther }
>;

export interface Mode {
  modeName: string;
  nextModeName: string;
  values: ModeValues;
}

export type ModeValuesNames = keyof ModeValues;

export interface Themes {
  default: Theme;
  trainer: Theme;
  [themeName: string]: Theme;
}

export interface SelectedThemes {
  editor: string;
  player: string;
  survey: string;
  trainer: string;
}

export interface ThemesState {
  editedThemeName: string;
  editedModeName: string;
  selectedThemes: SelectedThemes;
  themes: Themes;
}

export const defaultLightMode: Mode = {
  modeName: 'light',
  nextModeName: 'dark',
  values: {
    colors: {
      PrimaryColor: 'Primary color',
      PrimaryColorShade: 'Primary color shade',
      ActiveColor: 'Primary color shade',
      BackgroundColor: 'Background color',
      SecondaryBackgroundColor: 'Secondary background color',
      DisabledColor: 'Disabled color',
      HeaderColor: 'Primary color pastel',
      HighlightColor: 'Accent color',
      HoverColor: 'Primary color pastel',
      HoverTextColor: 'Secondary text color',
      DarkTextColor: 'Text color',
      LightTextColor: 'Secondary text color',
      WarningColor: 'Warning color',
      SuccessColor: 'Success color',
      ErrorColor: 'Error color',
    },
    dimensions: {
      BorderRadius: 'Border radius',
      BorderWidth: 'Border width',
    },
    others: {
      TextFont1: 'Font family 1',
      TextFont2: 'Font family 3',
    },
  },
};

export const defaultDarkMode: Mode = {
  modeName: 'dark',
  nextModeName: 'light',
  values: {
    colors: {
      PrimaryColor: 'Primary color',
      PrimaryColorShade: 'Primary color shade',
      ActiveColor: 'Secondary color pastel',
      BackgroundColor: 'Dark background color',
      SecondaryBackgroundColor: 'Dark secondary background color',
      DisabledColor: 'Disabled color',
      HeaderColor: 'Secondary color',
      HighlightColor: 'Accent color',
      HoverColor: 'Secondary color',
      HoverTextColor: 'Secondary text color',
      DarkTextColor: 'Secondary text color',
      LightTextColor: 'Text color',
      WarningColor: 'Warning color',
      SuccessColor: 'Success color',
      ErrorColor: 'Error color',
    },
    dimensions: {
      BorderRadius: 'Border radius',
      BorderWidth: 'Border width',
    },
    others: {
      TextFont1: 'Font family 1',
      TextFont2: 'Font family 3',
    },
  },
};

export const themeVar = Object.entries(defaultLightMode.values).reduce(
  (o, [sk, s]) => ({
    ...o,
    [sk]: Object.keys((s as {}) || {}).reduce(
      (o, ek) => ({
        ...o,
        [ek]: `var(--${sk}-${ek})`.toLowerCase(),
      }),
      {},
    ),
  }),
  defaultLightMode.values,
);

export function modeClass(themeValues: ThemeValues, mode: Mode): string {
  return css({
    '--current-mode-name': mode.modeName,
    '--next-mode-name': mode.nextModeName,
    ...Object.entries(mode.values).reduce(
      (o, [sk, s]) => ({
        ...o,
        ...Object.entries((s as {}) || {}).reduce(
          (o, [ek, e]) => ({
            ...o,
            [`--${sk}-${ek}`.toLowerCase()]:
              themeValues[sk as keyof ThemeValues][e as string] ||
              themeValues[sk as keyof ThemeValues][
                defaultLightMode.values[sk as keyof ModeComponent][ek] as string
              ],
          }),
          {},
        ),
      }),
      {},
    ),
  });
}

export const defaultThemeValues: ThemeValues = {
  colors: {
    'Primary color': '#0A9FF1',
    'Primary color shade': '#05517A',
    'Primary color tint': '#00ACFF',
    'Primary color pastel': '#D5EAF6',
    'Secondary color': '#46C892',
    'Secondary color shade': '#217058',
    'Secondary color tint': '#33E399',
    'Secondary color pastel': '#DCFAED',
    'Accent color': '#FFAF82',
    'Background color': '#fff',
    'Secondary background color': '#F1EFF3',
    'Dark background color': '#192F47',
    'Dark secondary background color': '#07182B',
    'Text color': '#313131',
    'Secondary text color': '#FFF',
    'Disabled color': '#C5C5C5',
    'Error color': '#DC0000',
    'Warning color': '#FFC700',
    'Success color': '#00B73E',
  },
  dimensions: {
    'Border radius': '8px',
    'Border width': '1px',
    'Font size 1': '2em',
    'Font size 2': '1.75em',
    'Font size 3': '1.25em',
    'Font size 4': '1em',
    'Font size 5': '0.9em',
  },
  others: {
    'Font family 1': '"Courier New"',
    'Font family 2': '"Montserrat"',
    'Font family 3': '"Raleway"',
  },
};

export const lobbyThemeValues: ThemeValues = {
  colors: {
    'Primary color': '#8CB62E',
    'Primary color shade': '#668422',
    'Primary color tint': '#AFDE45',
    'Primary color pastel': '#F1FFD0',
    'Secondary color': '#F2994A',
    'Secondary color shade': '#C35C00',
    'Secondary color tint': '#FFB778',
    'Secondary color pastel': '#FFDFC2',
    'Accent color': '#D4D4D4',
    'Background color': '#F9F9F9',
    'Secondary background color': '#FFF',
    'Dark background color': '#212121',
    'Dark secondary background color': '#111',
    'Text color': '#626262',
    'Secondary text color': '#fff',
    'Disabled color': '#EAEAEA',
    'Error color': '#DD1B1B',
    'Warning color': '#FFCD1A',
    'Success color': '#27AE60',
  },
  dimensions: {
    'Border radius': '8px',
    'Border width': '1px',
    'Font size 1': '2em',
    'Font size 2': '1.75em',
    'Font size 3': '1.25em',
    'Font size 4': '1em',
    'Font size 5': '0.9em',
  },
  others: {
    'Font family 1': '"Courier New"',
    'Font family 2': '"Montserrat"',
    'Font family 3': '"Raleway"',
  },
};

export const defaultTheme: Theme = {
  values: defaultThemeValues,
  modes: { light: defaultLightMode, dark: defaultDarkMode },
  modeClasses: {
    light: modeClass(defaultThemeValues, defaultLightMode),
    dark: modeClass(defaultThemeValues, defaultDarkMode),
  },
  baseMode: 'light',
};
export const trainerTheme: Theme = {
  values: lobbyThemeValues,
  modes: { light: defaultLightMode, dark: defaultDarkMode },
  modeClasses: {
    light: modeClass(lobbyThemeValues, defaultLightMode),
    dark: modeClass(lobbyThemeValues, defaultDarkMode),
  },
  baseMode: 'light',
};

export const defaultThemes: Themes = {
  default: defaultTheme,
  trainer: trainerTheme,
};

export const defaulSelectedThemes: SelectedThemes = {
  editor: 'default',
  player: 'default',
  survey: 'default',
  trainer: 'trainer',
};

export const defaultThemesState: ThemesState = {
  editedThemeName: 'default',
  editedModeName: 'light',
  selectedThemes: defaulSelectedThemes,
  themes: defaultThemes,
};
