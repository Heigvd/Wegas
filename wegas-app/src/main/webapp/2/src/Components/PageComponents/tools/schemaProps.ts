import { ScriptProps } from '../../../Editor/Components/FormView/Script/Script';
import { TYPESTRING, Schema, WidgetProps } from 'jsoninput/typings/types';
import { DEFINED_VIEWS } from '../../../Editor/Components/FormView';
import { WegasMethod } from '../../../Editor/editionConfig';
import { emptyStatement, Statement } from '@babel/types';
import { BooleanProps } from '../../../Editor/Components/FormView/Boolean';
import { StringInputProps } from '../../../Editor/Components/FormView/String';
import { CodeProps } from '../../../Editor/Components/FormView/Code';
import {
  Choices,
  IAsyncSelectProps,
} from '../../../Editor/Components/FormView/Select';
import { PageSelectProps } from '../../../Editor/Components/FormView/PageSelect';
import {
  TreeVariableSelectProps,
  ScripableVariableSelectProps,
  TreeVSelectProps,
} from '../../../Editor/Components/FormView/TreeVariableSelect';
import { IArrayProps } from '../../../Editor/Components/FormView/Array';
import { StatementViewProps } from '../../../Editor/Components/FormView/Script/Expressions/ExpressionEditor';
import { createScript } from '../../../Helper/wegasEntites';
import { CustomScriptProps } from '../../../Editor/Components/FormView/CustomScript';
import { IAbstractContentDescriptor, IScript } from 'wegas-ts-api';
import { ScriptableStringProps } from '../../../Editor/Components/FormView/ScriptableString';
import { ScriptableBooleanProps } from '../../../Editor/Components/FormView/ScriptableBoolean';

type TypedProps<T extends { view: {} }> = Schema<
  T['view'] & {
    type: keyof typeof DEFINED_VIEWS;
  }
>;

// For tests only
//const simpleSchemaProps: SimpleSchemaPropsType = {

const simpleSchemaProps = {
  hidden: ({
    required = false,
    type = 'array',
    index = 0,
  }: {
    type?: TYPESTRING | TYPESTRING[];
  } & SimpleSchemaProps): TypedProps<WidgetProps.BaseProps> => ({
    required,
    type,
    index,
    view: {
      type: 'hidden',
    },
  }),
  boolean: ({
    label,
    required = false,
    value,
    readOnly = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<boolean>): TypedProps<BooleanProps> => ({
    required,
    type: 'boolean',
    value,
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      readOnly,
      featureLevel,
      label,
      layout,
      type: 'boolean',
    },
  }),
  number: ({
    label,
    required = false,
    value,
    readOnly = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<number>): TypedProps<StringInputProps> => ({
    required,
    type: 'number',
    value,
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      layout,
      readOnly,
      type: 'number',
    },
  }),
  string: ({
    label,
    required = false,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    readOnly,
    fullWidth = false,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<string> & {
      fullWidth?: boolean;
    }): TypedProps<StringInputProps> => ({
    required,
    type: 'string',
    value,
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      layout,
      featureLevel,
      label,
      type: 'string',
      readOnly,
      fullWidth,
    },
  }),
  html: ({
    label,
    required = false,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    readOnly,
    noResize = false,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<ITranslatableContent> & { noResize?: boolean }) => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      layout,
      featureLevel,
      label,
      type: 'i18nhtml',
      readOnly,
      noResize,
    },
  }),
  custom: <T extends keyof typeof DEFINED_VIEWS>({
    label,
    required = false,
    type,
    viewType,
    value,
    index = 0,
    layout,
    readOnly = false,
    featureLevel = 'DEFAULT',
    borderTop,
    noMarginTop,
  }: {
    type?: WegasMethod['returns'];
    viewType?: T;
  } & CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<
      WegasScriptEditorNameAndTypes[Exclude<WegasMethod['returns'], undefined>]
    >) =>
    /* TODO : Improve  */
    /*: TypedProps<Parameters<typeof DEFINED_VIEWS[T]>[0]>*/
    ({
      featureLevel,
      required,
      type,
      value,
      index,
      view: {
        borderTop,
        noMarginTop,
        index,
        featureLevel,
        label,
        layout,
        readOnly,
        type: viewType,
      },
    }),
  script: ({
    label,
    required = false,
    mode = 'SET',
    language,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: {
    mode?: ScriptMode;
    language?: ScriptLanguage;
  } & CommonSchemaProps &
    ValueSchemaProps<string>): TypedProps<ScriptProps> => ({
    required,
    type: 'object',
    value: createScript(value, language),
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      mode,
      type: 'script',
      layout,
    },
  }),
  customScript: ({
    label,
    required = false,
    returnType,
    language,
    args,
    value,
    featureLevel,
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    scriptContext,
  }: {
    returnType?: WegasScriptEditorReturnTypeName[];
    language?: ScriptLanguage;
    args?: [string, WegasScriptEditorReturnTypeName[]][];
    scriptContext?: ScriptContext;
  } & CommonSchemaProps &
    ValueSchemaProps<string>): TypedProps<CustomScriptProps> => ({
    required,
    type: 'object',
    value: createScript(value, language),
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      returnType,
      args,
      type: 'customscript',
      layout,
      scriptContext,
    },
  }),
  code: ({
    label,
    required = false,
    language = 'JavaScript',
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: {
    language?: CodeLanguage;
  } & CommonSchemaProps &
    ValueSchemaProps<{} | string>): TypedProps<CodeProps> => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      language,
      type: 'code',
      layout,
    },
  }),
  select: <V extends string | SelectItem>({
    label,
    required = false,
    values = [],
    value,
    returnType = 'string',
    openChoices = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: {
    values?: readonly V[];
    returnType?: TYPESTRING | TYPESTRING[];
    openChoices?: boolean;
  } & CommonSchemaProps &
    ValueSchemaProps<V>): TypedProps<IAsyncSelectProps> & {
    enum: readonly unknown[];
  } => {
    let enumerator: readonly unknown[] = [];
    let choices: readonly SelectItem[] = [];
    if (values.length > 0) {
      if (typeof values[0] === 'string') {
        enumerator = values;
        choices = values.map(v => ({ label: v as string, value: v }));
      } else {
        enumerator = values.map(v => (v as SelectItem).value);
        choices = values as readonly SelectItem[];
      }
    }

    return {
      enum: enumerator,
      required,
      type: returnType,
      index,
      value,
      view: {
        borderTop,
        noMarginTop,
        index,
        choices: choices as (() => Promise<Choices>) | Choices,
        featureLevel,
        label,
        type: 'select',
        layout,
        undefined: !required,
        openChoices,
      },
    };
  },
  pageSelect: ({
    label,
    required = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: CommonSchemaProps): TypedProps<PageSelectProps> => {
    return {
      required,
      type: 'object',
      index,
      view: {
        borderTop,
        noMarginTop,
        index,
        featureLevel,
        label,
        type: 'pageselect',
        layout,
      },
    };
  },
  pageLoaderSelect: ({
    label,
    required = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: CommonSchemaProps): TypedProps<PageSelectProps> => {
    return {
      required,
      type: 'object',
      index,
      view: {
        borderTop,
        noMarginTop,
        index,
        featureLevel,
        label,
        type: 'pagesloaderselect',
        layout,
      },
    };
  },
  themeModeSelect: ({
    label,
    required = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: CommonSchemaProps): TypedProps<PageSelectProps> => {
    return {
      required,
      type: 'string',
      index,
      view: {
        borderTop,
        noMarginTop,
        index,
        featureLevel,
        label,
        type: 'thememodeselect',
        layout,
      },
    };
  },
  variable: ({
    label,
    required = false,
    returnType = [],
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    items,
    borderTop,
    noMarginTop,
  }: {
    returnType?: WegasScriptEditorReturnTypeName[];
    items?: TreeSelectItem<string>[];
  } & CommonSchemaProps): TypedProps<TreeVariableSelectProps> => ({
    required,
    type: 'string',
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      returnType,
      featureLevel,
      label,
      type: 'variableselect',
      layout,
      items,
    },
  }),
  tree: <T>({
    label,
    items,
    required = false,
    returnType = [],
    type = 'string',
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    borderBottom,
  }: {
    items?: TreeSelectItem<T>[];
    returnType?: WegasScriptEditorReturnTypeName[];
    type?: TYPESTRING | TYPESTRING[];
    borderBottom?: boolean;
  } & CommonSchemaProps): TypedProps<TreeVSelectProps<T>> => ({
    required,
    type,
    index,
    view: {
      borderTop,
      noMarginTop,
      borderBottom,
      index,
      returnType,
      featureLevel,
      label,
      type: 'treeselect',
      layout,
      items,
    },
  }),
  scriptVariable: ({
    label,
    required = false,
    returnType = [],
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: {
    returnType?: WegasScriptEditorReturnTypeName[];
  } & CommonSchemaProps): TypedProps<ScripableVariableSelectProps> => ({
    required,
    type: 'object',
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      returnType,
      featureLevel,
      label,
      type: 'scriptableVariableSelect',
      layout,
    },
  }),
  scriptString: ({
    label,
    required = false,
    value = undefined,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    richText,
  }: CommonSchemaProps &
    ValueSchemaProps<IScript> & {
      richText?: boolean;
    }): TypedProps<ScriptableStringProps> => ({
    required,
    type: 'object',
    index,
    value,
    view: {
      borderTop,
      noMarginTop,
      index,
      // returnType: ['string'],
      featureLevel,
      label,
      type: 'scriptableString',
      layout,
      richText,
    },
  }),
  scriptBoolean: ({
    label,
    required = false,
    value = undefined,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: CommonSchemaProps &
    ValueSchemaProps<IScript>): TypedProps<ScriptableBooleanProps> => ({
    required,
    type: 'object',
    index,
    value,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      type: 'scriptableBoolean',
      layout,
    },
  }),
  array: ({
    label,
    itemSchema = {},
    userOnChildAdd,
    requiredItems = false,
    itemType = 'object',
    required = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    highlight = true,
    sortable = true,
    borderTop,
    noMarginTop,
  }: {
    itemSchema: {};
    userOnChildAdd?: (value?: {}) => {};
    requiredItems?: boolean;
    itemType?: TYPESTRING;
    highlight?: boolean;
    sortable?: boolean;
  } & CommonSchemaProps): TypedProps<IArrayProps> => ({
    required,
    items: {
      properties: itemSchema,
      required: requiredItems,
      type: itemType,
    },
    type: 'array',
    index,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      type: 'array',
      layout,
      highlight,
      sortable,
      userOnChildAdd,
    },
  }),
  statement: ({
    label,
    required = false,
    mode = 'SET',
    value = emptyStatement(),
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: {
    mode?: ScriptMode;
  } & CommonSchemaProps &
    ValueSchemaProps<Statement>): TypedProps<StatementViewProps> => ({
    required,
    type: 'object',
    index,
    value,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      type: 'statement',
      layout,
      mode,
    },
  }),
  hashlist: ({
    label,
    required = false,
    choices,
    value = {},
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    objectViewStyle,
    cleaning,
  }: {
    choices?: HashListChoices;
    objectViewStyle?: boolean;
    cleaning?: CleaningHashmapMethods;
  } & CommonSchemaProps &
    ValueSchemaProps<object>) => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      choices,
      featureLevel,
      index,
      label,
      type: 'hashlist',
      layout,
      borderTop,
      noMarginTop,
      objectViewStyle,
      cleaning,
    },
  }),
  file: ({
    label,
    required = false,
    pickType = 'FILE',
    filter,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: {
    pickType?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<IAbstractContentDescriptor>) => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      pickType,
      filter,
      featureLevel,
      index,
      label,
      type: 'file',
      layout,
      borderTop,
      noMarginTop,
    },
  }),
  path: ({
    label,
    required = false,
    pickType = 'FILE',
    filter,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    scriptable,
  }: {
    pickType?: FilePickingType;
    filter?: FileFilter;
    scriptable?: boolean;
  } & CommonSchemaProps &
    ValueSchemaProps<string>) => ({
    required,
    type: scriptable ? 'object' : 'string',
    value,
    index,
    view: {
      pickType,
      filter,
      featureLevel,
      index,
      label,
      type: scriptable ? 'scriptablepath' : 'path',
      layout,
      borderTop,
      noMarginTop,
    },
  }),
} as const;

// For tests only !
//const objectSchemaProps: ObjectSchemaPropsType = {

const objectSchemaProps = {
  object: ({
    label,
    properties = {},
    required = false,
    value = {},
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
  }: {
    properties?: { [key: string]: SimpleSchemaPropsSchemas };
  } & CommonSchemaProps &
    ValueSchemaProps<object>) => ({
    description: 'com.wegas.core.persistence.variable.primitive.NumberInstance',
    properties,
    value,
    required,
    type: 'object',
    index,
    view: { featureLevel, index, label, layout, borderTop, noMarginTop },
  }),
} as const;

export const schemaProps = {
  ...simpleSchemaProps,
  ...objectSchemaProps,
} as const;

export type SchemaPropsType = typeof schemaProps;

type SimpleSchemaPropsValues = keyof typeof simpleSchemaProps;

export type SimpleSchemaPropsSchemas = ReturnType<
  typeof simpleSchemaProps[SimpleSchemaPropsValues]
>;

type ObjectSchemaPropsValues = keyof typeof objectSchemaProps;

type ObjectSchemaPropsSchemas = ReturnType<
  typeof objectSchemaProps[ObjectSchemaPropsValues]
>;

export type SchemaPropsValues =
  | SimpleSchemaPropsValues
  | ObjectSchemaPropsValues;

export type SchemaPropsSchemas =
  | SimpleSchemaPropsSchemas
  | ObjectSchemaPropsSchemas;
