import { ColorType } from './Theme';

export interface DefaultThemeColors {
  'Main color': ColorType;
  'Secondary color': ColorType;
  'Background color': ColorType;
  'Secondary background color': ColorType;
  'Text color': ColorType;
  'Secondary text color': ColorType;
  'Warning color': ColorType;
  'Error color': ColorType;
  'Success color': ColorType;
  'Disabled color': ColorType;
  'Highlight color': ColorType;
  'Hover color': ColorType;
}

export interface DefaultThemeDimensions {
  'Border radius': React.CSSProperties['borderRadius'];
  'Border width': React.CSSProperties['borderWidth'];
}

export interface DefaultThemeOthers {
  'Font family': React.CSSProperties['fontFamily'];
}

export type ModeColor = keyof DefaultThemeColors;
export type ModeDimension = keyof DefaultThemeDimensions;
export type ModeOther = keyof DefaultThemeOthers;

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

export interface Mode {
  modeName: string;
  nextModeName: string;
  values: {
    Common: ModeComponent<
      {
        MainColor: ModeColor;
        ActiveColor: ModeColor;
        BackgroundColor: ModeColor;
        TextColor: ModeColor;
        SecondaryTextColor: ModeColor;
        DisabledColor: ModeColor;
        BorderColor: ModeColor;
        HighlightColor: ModeColor;
        HeaderColor: ModeColor;
        HoverColor: ModeColor;
        HoverTextColor: ModeColor;
        WarningColor: ModeColor;
        SuccessColor: ModeColor;
        ErrorColor: ModeColor;
      },
      { BorderWidth: ModeDimension; BorderRadius: ModeDimension },
      { TextFont: ModeOther }
    >;
    Splitter: ModeComponent<undefined, { SplitterSize: ModeDimension }>;
  };
}

export type ModeComponentNames = keyof Mode['values'];
export type ModeComponents = Mode['values'][ModeComponentNames];

export const defaultLightMode: Mode = {
  modeName: 'light',
  nextModeName: 'dark',
  values: {
    Common: {
      colors: {
        MainColor: 'Main color',
        ActiveColor: 'Secondary color',
        BackgroundColor: 'Background color',
        BorderColor: 'Secondary background color',
        DisabledColor: 'Disabled color',
        HeaderColor: 'Secondary background color',
        HighlightColor: 'Highlight color',
        HoverColor: 'Hover color',
        HoverTextColor: 'Secondary text color',
        TextColor: 'Text color',
        SecondaryTextColor: 'Secondary text color',
        WarningColor: 'Warning color',
        SuccessColor: 'Success color',
        ErrorColor: 'Error color',
      },
      dimensions: {
        BorderRadius: 'Border radius',
        BorderWidth: 'Border width',
      },
      others: {
        TextFont: 'Font family',
      },
    },
    Splitter: {
      dimensions: {
        SplitterSize: 'Border width',
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
        MainColor: 'Background color',
        ActiveColor: 'Secondary background color',
        BackgroundColor: 'Text color',
        BorderColor: 'Secondary color',
        DisabledColor: 'Disabled color',
        HeaderColor: 'Secondary color',
        HighlightColor: 'Highlight color',
        HoverColor: 'Secondary color',
        HoverTextColor: 'Secondary text color',
        TextColor: 'Background color',
        SecondaryTextColor: 'Text color',
        WarningColor: 'Warning color',
        SuccessColor: 'Success color',
        ErrorColor: 'Error color',
      },
      dimensions: {
        BorderRadius: 'Border radius',
        BorderWidth: 'Border width',
      },
      others: {
        TextFont: 'Font family',
      },
    },
    Splitter: {
      dimensions: {
        SplitterSize: 'Border width',
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
