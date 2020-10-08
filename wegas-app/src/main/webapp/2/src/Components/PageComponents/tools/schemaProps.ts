import {
  ScriptMode,
  CodeLanguage,
  ScriptProps,
} from '../../../Editor/Components/FormView/Script/Script';
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
  TreeSelectItem,
} from '../../../Editor/Components/FormView/TreeVariableSelect';
import { IArrayProps } from '../../../Editor/Components/FormView/Array';
import { StatementViewProps } from '../../../Editor/Components/FormView/Script/Expressions/ExpressionEditor';
import { createScript } from '../../../Helper/wegasEntites';
import { HashListChoices } from '../../../Editor/Components/FormView/HashList';
import {
  FileFilter,
  FilePickingType,
} from '../../../Editor/Components/FileBrowser/FileBrowser';
import { CustomScriptProps } from '../../../Editor/Components/FormView/CustomScript';
import { IAbstractContentDescriptor } from 'wegas-ts-api';

type TypedProps<T extends { view: {} }> = Schema<
  T['view'] & {
    type: keyof typeof DEFINED_VIEWS;
  }
>;

type SchemaLayout = 'inline' | 'shortInline';

export interface SelectItem {
  label: string;
  value: {};
}

interface SimpleSchemaProps {
  required?: boolean;
  index?: number;
}

interface CommonSchemaProps extends SimpleSchemaProps {
  label?: string;
  featureLevel?: FeatureLevel;
  layout?: SchemaLayout;
  borderTop?: boolean;
}

interface ReadOnlySchemaProps {
  readOnly?: boolean;
}

interface ValueSchemaProps<T> {
  value?: T;
}

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
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<boolean>): TypedProps<BooleanProps> => ({
    required,
    type: 'boolean',
    value,
    index,
    view: {
      borderTop,
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
    required = true,
    value,
    readOnly = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<number>): TypedProps<StringInputProps> => ({
    required,
    type: 'number',
    value,
    index,
    view: {
      borderTop,
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
    required = true,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    readOnly,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<string>): TypedProps<StringInputProps> => ({
    required,
    type: 'string',
    value,
    index,
    view: {
      borderTop,
      index,
      layout,
      featureLevel,
      label,
      type: 'string',
      readOnly,
    },
  }),
  html: ({
    label,
    required = true,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    readOnly,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<ITranslatableContent>) => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      borderTop,
      index,
      layout,
      featureLevel,
      label,
      type: 'i18nhtml',
      readOnly,
    },
  }),
  custom: <T extends keyof typeof DEFINED_VIEWS>({
    label,
    required = true,
    type,
    viewType,
    value,
    index = 0,
    layout,
    readOnly = false,
    featureLevel = 'DEFAULT',
    borderTop,
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
  }: {
    mode?: ScriptMode;
    language?: 'JavaScript' | 'JSON' | 'TypeScript' | 'CSS';
  } & CommonSchemaProps &
    ValueSchemaProps<string>): TypedProps<ScriptProps> => ({
    required,
    type: 'object',
    value: createScript(value, language),
    index,
    view: {
      borderTop,
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
  }: {
    returnType?: WegasScriptEditorReturnTypeName[];
    language?: 'JavaScript' | 'JSON' | 'TypeScript' | 'CSS';
    args?: [string, WegasScriptEditorReturnTypeName[]][];
  } & CommonSchemaProps &
    ValueSchemaProps<string>): TypedProps<CustomScriptProps> => ({
    required,
    type: 'object',
    value: createScript(value, language),
    index,
    view: {
      borderTop,
      index,
      featureLevel,
      label,
      returnType,
      args,
      type: 'customscript',
      layout,
    },
  }),
  code: ({
    label,
    required = true,
    language = 'JavaScript',
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
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
  }: CommonSchemaProps): TypedProps<PageSelectProps> => {
    return {
      required,
      type: 'object',
      index,
      view: {
        borderTop,
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
  }: CommonSchemaProps): TypedProps<PageSelectProps> => {
    return {
      required,
      type: 'object',
      index,
      view: {
        borderTop,
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
  }: CommonSchemaProps): TypedProps<PageSelectProps> => {
    return {
      required,
      type: 'string',
      index,
      view: {
        borderTop,
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
    required = true,
    returnType = [],
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    items,
    borderTop,
  }: {
    returnType?: WegasScriptEditorReturnTypeName[];
    items?: TreeSelectItem<string>[];
  } & CommonSchemaProps): TypedProps<TreeVariableSelectProps> => ({
    required,
    type: 'string',
    index,
    view: {
      borderTop,
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
    required = true,
    returnType = [],
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
  }: {
    returnType?: WegasScriptEditorReturnTypeName[];
  } & CommonSchemaProps): TypedProps<ScripableVariableSelectProps> => ({
    required,
    type: 'object',
    index,
    view: {
      borderTop,
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
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
  }: CommonSchemaProps): TypedProps<ScripableVariableSelectProps> => ({
    required,
    type: 'object',
    index,
    view: {
      borderTop,
      index,
      returnType: ['string'],
      featureLevel,
      label,
      type: 'scriptableString',
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
  }: {
    itemSchema: {};
    userOnChildAdd?: (value?: {}) => void;
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
    objectViewStyle,
  }: {
    choices?: HashListChoices;
    objectViewStyle?: boolean;
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
      objectViewStyle,
    },
  }),
  file: ({
    label,
    required = false,
    pick = 'FILE',
    filter,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
  }: {
    pick?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<IAbstractContentDescriptor>) => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      pick,
      filter,
      featureLevel,
      index,
      label,
      type: 'file',
      layout,
      borderTop,
    },
  }),
  path: ({
    label,
    required = false,
    pick = 'FILE',
    filter,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
  }: {
    pick?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<string>) => ({
    required,
    type: 'string',
    value,
    index,
    view: {
      pick,
      filter,
      featureLevel,
      index,
      label,
      type: 'path',
      layout,
      borderTop,
    },
  }),
};

type SimpleSchemaPropsValues = keyof typeof simpleSchemaProps;

export type SimpleSchemaPropsSchemas = ReturnType<
  typeof simpleSchemaProps[SimpleSchemaPropsValues]
>;

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
    view: { featureLevel, index, label, layout, borderTop },
  }),
};

type ObjectSchemaPropsValues = keyof typeof objectSchemaProps;

type ObjectSchemaPropsSchemas = ReturnType<
  typeof objectSchemaProps[ObjectSchemaPropsValues]
>;

export const schemaProps = { ...simpleSchemaProps, ...objectSchemaProps };

export type SchemaPropsValues =
  | SimpleSchemaPropsValues
  | ObjectSchemaPropsValues;

export type SchemaPropsSchemas =
  | SimpleSchemaPropsSchemas
  | ObjectSchemaPropsSchemas;
