import { ModeComponent, ColorType } from './Theme';

export interface DefaultThemeColors {
  'Main color': ColorType;
  'Background color': ColorType;
  'Text color': ColorType;
  'Warning color': ColorType;
  'Error color': ColorType;
  'Sucess color': ColorType;
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

type ModeColor = keyof DefaultThemeColors;
type ModeDimension = keyof DefaultThemeDimensions;
type ModeOthers = keyof DefaultThemeOthers;

export interface Mode {
  Layout: ModeComponent<
    {
      BackgroundColor: ModeColor;
      TextColor: ModeColor;
      BorderColor: ModeColor;
    },
    { BorderWidth: ModeDimension },
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
  Text: ModeComponent<{
    TextColor: ModeColor;
    HoverColor: ModeColor;
  }>;
}

export type ModeComponentNames = keyof Mode;

export const defaultMode: Mode = {
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
      BorderColor: 'Main color',
    },
    dimensions: {
      BorderWidth: 'Border width',
    },
    others: {
      TextFont: 'Font family',
    },
  },
  Text: {
    colors: {
      TextColor: 'Text color',
      HoverColor: 'Hover color',
    },
    dimensions: {},
    others: {},
  },
};

export const themeVar: Mode = Object.entries(defaultMode).reduce(
  (o, [ck, c]) => ({
    ...o,
    [ck]: Object.entries(c).reduce(
      (o, [sk, s]) => ({
        ...o,
        [sk]: Object.keys((s as {}) || {}).reduce(
          (o, ek) => ({ ...o, [ek]: `var(--${ck}-${sk}-${ek})`.toLowerCase() }),
          {},
        ),
      }),
      {},
    ),
  }),
  defaultMode,
);
