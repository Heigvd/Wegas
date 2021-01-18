import { ColorType } from './Theme';

export interface DefaultThemeColors {
  'Primary color': ColorType;
  'Primary color shade': ColorType;
  'Primary color tint': ColorType;
  'Primary color pastel' : ColorType;
  'Secondary color': ColorType;
  'Secondary color shade': ColorType;
  'Secondary color tint': ColorType;
  'Secondary color pastel': ColorType;
  'Highlight color': ColorType;
  'Background color': ColorType;
  'Secondary background color': ColorType;
  'Text color': ColorType;
  'Secondary text color': ColorType;
  'Disabled color': ColorType;
  'Error color': ColorType;
  'Warning color': ColorType;
  'Success color': ColorType;
  'Hover color': ColorType;
  'Header color': ColorType;
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

export interface Mode {
  modeName: string;
  nextModeName: string;
  values: {
    Common: ModeComponent<
      {
        PrimaryColor: ModeColor;
        ActiveColor: ModeColor;
        BackgroundColor: ModeColor;
        TextColor: ModeColor;
        SecondaryTextColor: ModeColor;
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
        PrimaryColor: 'Primary color',
        ActiveColor: 'Secondary color',
        BackgroundColor: 'Background color',
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
        TextBackground4: 'Header color',
        TextColor5: 'Secondary text color',
        TextBackground5: 'Header color',
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
        PrimaryColor: 'Background color',
        ActiveColor: 'Secondary background color',
        BackgroundColor: 'Text color',
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
        TextBackground4: 'Header color',
        TextColor5: 'Secondary text color',
        TextBackground5: 'Header color',
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
