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
  Layout: ModeComponent<
    {
      BackgroundColor: ModeColor;
      HeaderBackgroundColor: ModeColor;
      TextColor: ModeColor;
      BorderColor: ModeColor;
      HighlightBorderColor: ModeColor;
    },
    { BorderWidth: ModeDimension },
    { TextFont: ModeOther }
  >;
  Button: ModeComponent<
    {
      Color: ModeColor;
      DisabledColor: ModeColor;
      TextColor: ModeColor;
      HoverColor: ModeColor;
      HoverTextColor: ModeColor;
      ConfirmButtonZoneColor: ModeColor;
      ConfirmButtonAcceptColor: ModeColor;
      IconButtonActiveColor: ModeColor;
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
    HoverBackgroundColor: ModeColor;
    HoverTextColor: ModeColor;
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
      SplitterHoverColor: ModeColor;
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
  CodeEditor: ModeComponent<{
    DiffEditorLabelColor: ModeColor;
  }>;
  InfoBeam: ModeComponent<{
    TextColor: ModeColor;
    BackgroundColor: ModeColor;
  }>;
  PageLayout: ModeComponent<
    {
      SelectedIndexItemColor: ModeColor;
      SelectedComponentColor: ModeColor;
      FocusedComponentColor: ModeColor;
      ActiveIconColor: ModeColor;
    },
    { TitleRadius: ModeDimension }
  >;
  PageLoader: ModeComponent<{
    ActiveEditionColor: ModeColor;
    InactiveEditionColor: ModeColor;
  }>;
  EditableComponent: ModeComponent<{
    HighlightedBorderColor: ModeColor;
    DisabledColor: ModeColor;
    BorderHoverColor: ModeColor;
    FocusedColor: ModeColor;
  }>;
  NumberSlider: ModeComponent<{ ActiveColor: ModeColor }>;
  Toggler: ModeComponent<{
    BorderColor: ModeColor;
    BorderDisabledColor: ModeColor;
    CheckedColor: ModeColor;
    UncheckedColor: ModeColor;
    HandleColor: ModeColor;
    HandleDisabledColor: ModeColor;
  }>;
  MessageString: ModeComponent<{
    NormalColor: ModeColor;
    SuccessColor: ModeColor;
    WarningColor: ModeColor;
    ErrorColor: ModeColor;
  }>;
  LanguageEditor: ModeComponent<{
    EditionTextColor: ModeColor;
    SimpleTextColor: ModeColor;
  }>;
  FileBrowser: ModeComponent<
    {
      NodeHoverColor: ModeColor;
      NodeDisabledColor: ModeColor;
      BackgroundColor: ModeColor;
      BorderColor: ModeColor;
    },
    { BorderRadius: ModeDimension }
  >;
  TabLayout: ModeComponent<{
    MenuTextColor: ModeColor;
    MenuBackgroundColor: ModeColor;
    TabColor: ModeColor;
    ActiveTabColor: ModeColor;
    TabTextColor: ModeColor;
    ActiveTabTextColor: ModeColor;
    BorderColor: ModeColor;
  }>;
  ComponentPalette: ModeComponent<{
    ComponentColor: ModeColor;
  }>;
  ScriptEditor: ModeComponent<{
    BackgroundColor: ModeColor;
  }>;
  EntityChooser: ModeComponent<{
    ActiveBackgroundColor: ModeColor;
    InactiveBackgroundColor: ModeColor;
    ActiveTextColor: ModeColor;
    InactiveTextColor: ModeColor;
  }>;
  MultipleChoice: ModeComponent<{
    ChoiceColor: ModeColor;
    ChoiceHoverColor: ModeColor;
    SelectedChoiceColor: ModeColor;
    SelectedChoiceHoverColor: ModeColor;
    DisabledChoiceColor: ModeColor;
    DisabledChoiceHoverColor: ModeColor;
  }>;
  Gauge: ModeComponent<{
    PositiveColor: ModeColor;
    NegativeColor: ModeColor;
    DisabledColor: ModeColor;
    NeedleColor: ModeColor;
    NeedleBorderColor: ModeColor;
    WarningColor: ModeColor;
  }>;
  NumberValue: ModeComponent<{
    BackgroundColor: ModeColor;
    TextColor: ModeColor;
  }>;
}

export type ModeComponentNames = keyof Mode;

export const defaultMode: Mode = {
  Button: {
    colors: {
      Color: 'Main color',
      TextColor: 'Secondary text color',
      HoverColor: 'Hover color',
      HoverTextColor: 'Secondary text color',
      DisabledColor: 'Disabled color',
      ConfirmButtonZoneColor: 'Disabled color',
      ConfirmButtonAcceptColor: 'Warning color',
      IconButtonActiveColor: 'Secondary color',
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
      HeaderBackgroundColor: 'Secondary background color',
      TextColor: 'Text color',
      BorderColor: 'Main color',
      HighlightBorderColor: 'Highlight color',
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
      TextColor: 'Text color',
      BackgroundColor: 'Background color',
      ShadowColor: 'Main color',
      HoverBackgroundColor: 'Hover color',
      HoverTextColor: 'Text color',
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
      SplitterHoverColor: 'Hover color',
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
      DropZoneHoverColor: 'Success color',
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
      ChoiceTextColor: 'Text color',
      DisabledQuestionColor: 'Disabled color',
    },
  },
  Checkbox: {
    colors: {
      TextColor: 'Text color',
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
  CodeEditor: {
    colors: {
      DiffEditorLabelColor: 'Main color',
    },
  },
  InfoBeam: {
    colors: {
      TextColor: 'Text color',
      BackgroundColor: 'Warning color',
    },
  },
  PageLayout: {
    colors: {
      ActiveIconColor: 'Success color',
      FocusedComponentColor: 'Hover color',
      SelectedComponentColor: 'Main color',
      SelectedIndexItemColor: 'Secondary color',
    },
    dimensions: {
      TitleRadius: 'Border radius',
    },
  },
  PageLoader: {
    colors: {
      ActiveEditionColor: 'Hover color',
      InactiveEditionColor: 'Disabled color',
    },
  },
  EditableComponent: {
    colors: {
      BorderHoverColor: 'Main color',
      DisabledColor: 'Disabled color',
      FocusedColor: 'Hover color',
      HighlightedBorderColor: 'Highlight color',
    },
  },
  NumberSlider: {
    colors: {
      ActiveColor: 'Main color',
    },
  },
  Toggler: {
    colors: {
      BorderColor: 'Secondary color',
      BorderDisabledColor: 'Disabled color',
      CheckedColor: 'Success color',
      UncheckedColor: 'Error color',
      HandleColor: 'Main color',
      HandleDisabledColor: 'Disabled color',
    },
  },
  MessageString: {
    colors: {
      NormalColor: 'Text color',
      SuccessColor: 'Success color',
      WarningColor: 'Warning color',
      ErrorColor: 'Error color',
    },
  },
  LanguageEditor: {
    colors: {
      EditionTextColor: 'Secondary color',
      SimpleTextColor: 'Text color',
    },
  },
  FileBrowser: {
    colors: {
      NodeDisabledColor: 'Disabled color',
      NodeHoverColor: 'Hover color',
      BackgroundColor: 'Background color',
      BorderColor: 'Main color',
    },
    dimensions: {
      BorderRadius: 'Border radius',
    },
  },
  TabLayout: {
    colors: {
      MenuBackgroundColor: 'Background color',
      MenuTextColor: 'Text color',
      TabColor: 'Main color',
      TabTextColor: 'Secondary text color',
      ActiveTabColor: 'Background color',
      ActiveTabTextColor: 'Main color',
      BorderColor: 'Secondary color',
    },
  },
  ComponentPalette: {
    colors: {
      ComponentColor: 'Main color',
    },
  },
  ScriptEditor: {
    colors: {
      BackgroundColor: 'Hover color',
    },
  },
  EntityChooser: {
    colors: {
      ActiveBackgroundColor: 'Secondary color',
      InactiveBackgroundColor: 'Main color',
      ActiveTextColor: 'Secondary text color',
      InactiveTextColor: 'Secondary text color',
    },
  },
  MultipleChoice: {
    colors: {
      ChoiceColor: 'Main color',
      ChoiceHoverColor: 'Secondary color',
      SelectedChoiceColor: 'Secondary color',
      SelectedChoiceHoverColor: 'Main color',
      DisabledChoiceColor: 'Disabled color',
      DisabledChoiceHoverColor: 'Hover color',
    },
  },
  Gauge: {
    colors: {
      NeedleColor: 'Main color',
      NeedleBorderColor: 'Secondary color',
      DisabledColor: 'Disabled color',
      NegativeColor: 'Error color',
      PositiveColor: 'Success color',
      WarningColor: 'Warning color',
    },
  },
  NumberValue: {
    colors: {
      BackgroundColor: 'Main color',
      TextColor: 'Text color',
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
