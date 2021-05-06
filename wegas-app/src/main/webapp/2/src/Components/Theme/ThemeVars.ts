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
  O extends { [entry: string]: ModeOther } | undefined = undefined
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

export interface ModeValues {
  Common: ModeComponent<
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
  Splitter: ModeComponent<undefined, { SplitterSize: ModeDimension }>;
  ComponentTitle: ModeComponent<
    {
      TextColor1: ModeColor;
      TextBackground1: ModeColor;
      TextColor2: ModeColor;
      TextBackground2: ModeColor;
      TextColor3: ModeColor;
      TextBackground3: ModeColor;
      TextColor4: ModeColor;
      TextBackground4: ModeColor;
      TextColor5: ModeColor;
      TextBackground5: ModeColor;
    },
    {
      FontSize1: ModeDimension;
      FontSize2: ModeDimension;
      FontSize3: ModeDimension;
      FontSize4: ModeDimension;
      FontSize5: ModeDimension;
    },
    {
      FontFamily1: ModeOther;
      FontFamily2: ModeOther;
      FontFamily3: ModeOther;
      FontFamily4: ModeOther;
      FontFamily5: ModeOther;
    }
  >;
}

export interface Mode {
  modeName: string;
  nextModeName: string;
  values: ModeValues;
}

export type ModeComponentNames = keyof Mode['values'];
export type ModeComponents = Mode['values'][ModeComponentNames];

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
    Common: {
      colors: {
        PrimaryColor: 'Primary color',
        PrimaryColorShade: 'Primary color shade',
        ActiveColor: 'Secondary color shade',
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
    Splitter: {
      dimensions: {
        SplitterSize: 'Border width',
      },
    },
    ComponentTitle: {
      colors: {
        TextColor1: 'Text color',
        TextBackground1: undefined,
        TextColor2: 'Text color',
        TextBackground2: undefined,
        TextColor3: 'Text color',
        TextBackground3: undefined,
        TextColor4: 'Text color',
        TextBackground4: 'Secondary color pastel',
        TextColor5: 'Secondary text color',
        TextBackground5: 'Secondary color pastel',
      },
      dimensions: {
        FontSize1: 'Font size 1',
        FontSize2: 'Font size 2',
        FontSize3: 'Font size 3',
        FontSize4: 'Font size 4',
        FontSize5: 'Font size 5',
      },
      others: {
        FontFamily1: 'Font family 2',
        FontFamily2: 'Font family 2',
        FontFamily3: 'Font family 2',
        FontFamily4: 'Font family 2',
        FontFamily5: 'Font family 2',
      },
    },
  },
};

export const defaultDarkMode: Mode = {
  modeName: 'dark',
  nextModeName: 'light',
  values: {
    Common: {
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
    Splitter: {
      dimensions: {
        SplitterSize: 'Border width',
      },
    },
    ComponentTitle: {
      colors: {
        TextColor1: 'Background color',
        TextBackground1: undefined,
        TextColor2: 'Background color',
        TextBackground2: undefined,
        TextColor3: 'Background color',
        TextBackground3: undefined,
        TextColor4: 'Background color',
        TextBackground4: 'Secondary color pastel',
        TextColor5: 'Secondary text color',
        TextBackground5: 'Secondary color pastel',
      },
      dimensions: {
        FontSize1: 'Font size 1',
        FontSize2: 'Font size 2',
        FontSize3: 'Font size 3',
        FontSize4: 'Font size 4',
        FontSize5: 'Font size 5',
      },
      others: {
        FontFamily1: 'Font family 2',
        FontFamily2: 'Font family 2',
        FontFamily3: 'Font family 2',
        FontFamily4: 'Font family 2',
        FontFamily5: 'Font family 2',
      },
    },
  },
};

export const themeVar = Object.entries(defaultLightMode.values).reduce(
  (o, [ck, c]) => ({
    ...o,
    [ck]: Object.entries(c).reduce(
      (o, [sk, s]) => ({
        ...o,
        [sk]: Object.keys((s as {}) || {}).reduce(
          (o, ek) => ({
            ...o,
            [ek]: `var(--${ck}-${sk}-${ek})`.toLowerCase(),
          }),
          {},
        ),
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

export const defaultThemeValues: ThemeValues = {
  colors: {
    'Primary color': '#1565C0',
    'Primary color shade': '#0B4F9D',
    'Primary color tint': '#4D96EA',
    'Primary color pastel': '#CFE5FF',
    'Secondary color': '#00499c',
    'Secondary color shade': '#003A7C',
    'Secondary color tint': '#1D67BB',
    'Secondary color pastel': '#ADD3FF',
    'Accent color': 'hotpink',
    'Background color': 'white',
    'Secondary background color': '#EAEFF5',
    'Dark background color': '#192F47',
    'Dark secondary background color': '#07182B',
    'Text color': '#232323',
    'Secondary text color': 'white',
    'Disabled color': 'lightgrey',
    'Error color': 'red',
    'Warning color': '#ff9d00',
    'Success color': 'green',
  },
  dimensions: {
    'Border radius': '5px',
    'Border width': '2px',
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
