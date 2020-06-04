import { ColorType } from './Theme';

export interface DefaultThemeColors {
  'Main color': ColorType;
  'Secondary color': ColorType;
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
  Layout: ModeComponent<
    {
      BackgroundColor: ModeColor;
      TextColor: ModeColor;
      BorderColor: ModeColor;
    },
    { BorderWidth: ModeDimension },
    { TextFont: ModeOther }
  >;
  Button: ModeComponent<
    {
      Color: ModeColor;
      TextColor: ModeColor;
      HoverColor: ModeColor;
    },
    { Radius: ModeDimension },
    { TextFont: ModeOther }
  >;
  Text: ModeComponent<{
    TextColor: ModeColor;
    HoverColor: ModeColor;
  }>;
  Menu: ModeComponent<{
    TextColor: ModeColor;
    BackgroundColor: ModeColor;
    ShadowColor: ModeColor;
  }>;
  PageTree: ModeComponent<{
    DefaultItemTextColor: ModeColor;
  }>;
  PhaseProgressBar: ModeComponent<{
    BorderColor: ModeColor;
    InProgressColor: ModeColor;
    DoneColor: ModeColor;
  }>;
  TextInput: ModeComponent<
    {
      BorderColor: ModeColor;
      ReadonlyColor: ModeColor;
    },
    { BorderRadius: ModeDimension }
  >;
  FonkyFlex: ModeComponent<
    {
      SplitterColor: ModeColor;
    },
    { SplitterSize: ModeDimension }
  >;
  VariableTree: ModeComponent<{
    HoverColor: ModeColor;
  }>;
  DragAndDrop: ModeComponent<{
    DropZoneColor: ModeColor;
    DropZoneHoverColor: ModeColor;
  }>;
  Selection: ModeComponent<
    {
      LocalSelectionColor: ModeColor;
      GlobalSelectionColor: ModeColor;
      SearchSelectionColor: ModeColor;
    },
    { SelectionRadius: ModeDimension }
  >;
  NumberBox: ModeComponent<{
    SquareBorderColor: ModeColor;
    SquareBorderHoverColor: ModeColor;
    SquareColor: ModeColor;
    SquareDisabledColor: ModeColor;
  }>;
  Question: ModeComponent<{
    ChoiceTextColor: ModeColor;
    DisabledQuestionColor: ModeColor;
  }>;
  Checkbox: ModeComponent<{
    TextColor: ModeColor;
    DisabledTextColor: ModeColor;
    ReadonlyTextColor: ModeColor;
  }>;
  EditHandle: ModeComponent<
    { BorderColor: ModeColor; BackgroundColor: ModeColor },
    { BorderRadius: ModeDimension }
  >;
  InstanceEditor: ModeComponent<{
    BorderColor: ModeColor;
    HoverColor: ModeColor;
  }>;
  StateMachineEditor: ModeComponent<{
    SearchColor: ModeColor;
    RelationColor: ModeColor;
    RelationHoverColor: ModeColor;
    ActiveStateBorderColor: ModeColor;
    ActiveStateColor: ModeColor;
  }>;
}

export type ModeComponentNames = keyof Mode;

export const defaultMode: Mode = {
  Button: {
    colors: {
      Color: 'Main color',
      TextColor: 'Background color',
      HoverColor: 'Hover color',
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
  },
  Menu: {
    colors: {
      TextColor: 'Main color',
      BackgroundColor: 'Background color',
      ShadowColor: 'Main color',
    },
  },
  PageTree: {
    colors: {
      DefaultItemTextColor: 'Secondary color',
    },
  },
  PhaseProgressBar: {
    colors: {
      BorderColor: 'Disabled color',
      InProgressColor: 'Secondary color',
      DoneColor: 'Main color',
    },
  },
  TextInput: {
    colors: {
      BorderColor: 'Main color',
      ReadonlyColor: 'Disabled color',
    },
    dimensions: {
      BorderRadius: 'Border radius',
    },
  },
  FonkyFlex: {
    colors: {
      SplitterColor: 'Main color',
    },
    dimensions: {
      SplitterSize: 'Border width',
    },
  },
  VariableTree: {
    colors: {
      HoverColor: 'Hover color',
    },
  },
  DragAndDrop: {
    colors: {
      DropZoneColor: 'Hover color',
      DropZoneHoverColor: 'Sucess color',
    },
  },
  Selection: {
    colors: {
      LocalSelectionColor: 'Main color',
      GlobalSelectionColor: 'Secondary color',
      SearchSelectionColor: 'Highlight color',
    },
    dimensions: {
      SelectionRadius: 'Border radius',
    },
  },
  NumberBox: {
    colors: {
      SquareBorderColor: 'Disabled color',
      SquareBorderHoverColor: 'Text color',
      SquareColor: 'Main color',
      SquareDisabledColor: 'Disabled color',
    },
  },
  Question: {
    colors: {
      ChoiceTextColor: 'Main color',
      DisabledQuestionColor: 'Disabled color',
    },
  },
  Checkbox: {
    colors: {
      TextColor: 'Main color',
      DisabledTextColor: 'Disabled color',
      ReadonlyTextColor: 'Secondary color',
    },
  },
  EditHandle: {
    colors: {
      BackgroundColor: 'Hover color',
      BorderColor: 'Main color',
    },
    dimensions: {
      BorderRadius: 'Border radius',
    },
  },
  InstanceEditor: {
    colors: {
      BorderColor: 'Main color',
      HoverColor: 'Hover color',
    },
  },
  StateMachineEditor: {
    colors: {
      RelationColor: 'Main color',
      RelationHoverColor: 'Secondary color',
      SearchColor: 'Highlight color',
      ActiveStateBorderColor: 'Main color',
      ActiveStateColor: 'Warning color',
    },
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
