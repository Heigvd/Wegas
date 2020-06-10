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
        DisabledColor: ModeColor;
        BorderColor: ModeColor;
        HighlightColor: ModeColor;
        HeaderColor: ModeColor;
        HoverColor: ModeColor;
        HoverTextColor: ModeColor;
        WarningColor: ModeColor;
        SuccessColor: ModeColor;
      },
      { BorderWidth: ModeDimension; BorderRadius: ModeDimension },
      { TextFont: ModeOther }
    >;
    FonkyFlex: ModeComponent<
      {
        SplitterColor: ModeColor;
      },
      { SplitterSize: ModeDimension }
    >;
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
    StateMachineEditor: ModeComponent<{
      SearchColor: ModeColor;
      RelationColor: ModeColor;
      RelationHoverColor: ModeColor;
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
      DisabledColor: ModeColor;
      BorderHoverColor: ModeColor;
      FocusedColor: ModeColor;
    }>;
    NumberSlider: ModeComponent<{ ActiveColor: ModeColor }>;
    Toggler: ModeComponent<{
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
      WarningColor: ModeColor;
    }>;
    NumberValue: ModeComponent<{
      BackgroundColor: ModeColor;
      TextColor: ModeColor;
    }>;
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
        BorderColor: 'Hover color',
        DisabledColor: 'Disabled color',
        HeaderColor: 'Secondary background color',
        HighlightColor: 'Highlight color',
        HoverColor: 'Hover color',
        HoverTextColor: 'Secondary text color',
        TextColor: 'Text color',
        WarningColor: 'Warning color',
        SuccessColor: 'Success color',
      },
      dimensions: {
        BorderRadius: 'Border radius',
        BorderWidth: 'Border width',
      },
      others: {
        TextFont: 'Font family',
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
    StateMachineEditor: {
      colors: {
        RelationColor: 'Main color',
        RelationHoverColor: 'Secondary color',
        SearchColor: 'Highlight color',
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
      },
    },
    NumberSlider: {
      colors: {
        ActiveColor: 'Main color',
      },
    },
    Toggler: {
      colors: {
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
  },
};

export const defaultDarkMode: Mode = {
  modeName: 'dark',
  nextModeName: 'light',
  values: {
    Common: {
      colors: {
        MainColor: 'Main color',
        ActiveColor: 'Secondary color',
        BackgroundColor: 'Text color',
        BorderColor: 'Hover color',
        DisabledColor: 'Disabled color',
        HeaderColor: 'Hover color',
        HighlightColor: 'Highlight color',
        HoverColor: 'Hover color',
        HoverTextColor: 'Secondary text color',
        TextColor: 'Background color',
        WarningColor: 'Warning color',
        SuccessColor: 'Success color',
      },
      dimensions: {
        BorderRadius: 'Border radius',
        BorderWidth: 'Border width',
      },
      others: {
        TextFont: 'Font family',
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
    StateMachineEditor: {
      colors: {
        RelationColor: 'Main color',
        RelationHoverColor: 'Secondary color',
        SearchColor: 'Highlight color',
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
      },
    },
    NumberSlider: {
      colors: {
        ActiveColor: 'Main color',
      },
    },
    Toggler: {
      colors: {
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
