import { emptyStatement, Statement } from '@babel/types';
import { TYPESTRING } from 'jsoninput/typings/types';
import * as React from 'react';
import { IAbstractContentDescriptor, IScript } from 'wegas-ts-api';
import { createScript } from '../../../Helper/wegasEntites';
import {
  AvailableSchemas,
  DEFINED_VIEWS,
  SchemaFromView,
} from '../../FormView';
import { CallbackViewView } from '../../FormView/Callback';
import { CodeViewView } from '../../FormView/Code';
import { NuppleView } from '../../FormView/Nupple';
import { WegasMethod } from '../../FormView/Script/editionConfig';
import { ScriptableViewView } from '../../FormView/Scriptable';
import { Choices } from '../../Selector';

const simpleSchemaProps = {
  hidden: ({
    required = false,
    type = 'array',
    index = 0,
    value,
  }: {
    type?: TYPESTRING | TYPESTRING[];
    value?: any;
  } & SimpleSchemaProps): SchemaFromView<'hidden'> => ({
    required,
    type,
    index,
    view: {
      type: 'hidden',
    },
    value,
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
    description,
    visible,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<boolean>): SchemaFromView<'boolean'> => ({
    required,
    type: 'boolean',
    value,
    index,
    visible,
    view: {
      borderTop,
      noMarginTop,
      index,
      readOnly,
      featureLevel,
      label,
      layout,
      type: 'boolean',
      description,
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
    description,
    visible,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<number>): SchemaFromView<'number'> => ({
    required,
    type: 'number',
    value,
    index,
    visible,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      layout,
      readOnly,
      type: 'number',
      description,
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
    description,
    visible,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<string> & {
      fullWidth?: boolean;
    }): SchemaFromView<'string'> => ({
    required,
    type: 'string',
    value,
    index,
    visible,
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
      description,
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
    description,
    visible,
  }: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<ITranslatableContent> & { noResize?: boolean }) => ({
    required,
    type: 'object',
    value,
    index,
    visible,
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
      description,
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
    description,
    visible,
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
      visible,
      view: {
        borderTop,
        noMarginTop,
        index,
        featureLevel,
        label,
        layout,
        readOnly,
        type: viewType,
        description,
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
    description,
    visible,
  }: {
    mode?: ScriptMode;
    language?: ScriptLanguage;
  } & CommonSchemaProps &
    ValueSchemaProps<string>): SchemaFromView<'script'> => ({
    required,
    type: 'object',
    value: createScript(value, language),
    index,
    visible,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      mode,
      type: 'script',
      layout,
      description,
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
    description,
    visible,
  }: {
    returnType?: string[];
    language: ScriptLanguage;
    args?: [string, string[]][];
  } & CommonSchemaProps &
    ValueSchemaProps<string>): SchemaFromView<'customscript'> => ({
    required,
    type: 'object',
    value: createScript(value, language),
    index,
    visible,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      type: 'customscript',
      returnType,
      args,
      language,
      layout,
      description,
    },
  }),
  code: ({
    label,
    required = false,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    description,
    scriptProps,
    borderBottom,
    readOnly,
  }: CodeViewView &
    CommonSchemaProps &
    ValueSchemaProps<IScript>): SchemaFromView<'code'> => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      scriptProps,
      borderTop,
      borderBottom,
      readOnly,
      noMarginTop,
      index,
      featureLevel,
      label,
      type: 'code',
      layout,
      description,
    },
  }),
  callback: ({
    label,
    required = false,
    value,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    description,
    callbackProps,
    borderBottom,
    readOnly,
  }: CallbackViewView &
    CommonSchemaProps &
    ValueSchemaProps<IScript>): SchemaFromView<'callback'> => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      callbackProps,
      borderTop,
      borderBottom,
      readOnly,
      noMarginTop,
      index,
      featureLevel,
      label,
      type: 'callback',
      layout,
      description,
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
    description,
    visible,
  }: {
    values?: readonly V[];
    returnType?: TYPESTRING | TYPESTRING[];
    openChoices?: boolean;
  } & CommonSchemaProps &
    ValueSchemaProps<V>): SchemaFromView<'select'> & {
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
      enum: [...enumerator, required ? [] : [undefined]],
      required,
      type: returnType,
      index,
      visible,
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
        allowUndefined: !required,
        openChoices,
        description,
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
    description,
    visible,
  }: CommonSchemaProps): SchemaFromView<'pageselect'> => {
    return {
      required,
      type: 'string',
      index,
      visible,
      view: {
        borderTop,
        noMarginTop,
        index,
        featureLevel,
        label,
        type: 'pageselect',
        layout,
        description,
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
    description,
    visible,
  }: CommonSchemaProps): SchemaFromView<'pagesloaderselect'> => {
    return {
      required,
      type: 'object',
      index,
      visible,
      view: {
        borderTop,
        noMarginTop,
        index,
        featureLevel,
        label,
        type: 'pagesloaderselect',
        layout,
        description,
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
    description,
    visible,
  }: CommonSchemaProps): SchemaFromView<'thememodeselect'> => {
    return {
      required,
      type: 'string',
      index,
      visible,
      view: {
        borderTop,
        noMarginTop,
        index,
        featureLevel,
        label,
        type: 'thememodeselect',
        layout,
        description,
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
    description,
    visible,
  }: {
    returnType?: WegasScriptEditorReturnTypeName[];
    items?: TreeSelectItem<string>[];
  } & CommonSchemaProps): SchemaFromView<'variableselect'> => ({
    required,
    type: 'string',
    index,
    visible,
    view: {
      borderTop,
      noMarginTop,
      index,
      returnType,
      featureLevel,
      label,
      required,
      type: 'variableselect',
      layout,
      items,
      description,
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
    description,
    visible,
  }: {
    items?: TreeSelectItem<T>[];
    returnType?: WegasScriptEditorReturnTypeName[];
    type?: TYPESTRING | TYPESTRING[];
    borderBottom?: boolean;
  } & CommonSchemaProps): SchemaFromView<'treeselect'> => ({
    required,
    type,
    index,
    visible,
    view: {
      borderTop,
      noMarginTop,
      borderBottom,
      index,
      required,
      returnType,
      featureLevel,
      label,
      type: 'treeselect',
      layout,
      items,
      description,
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
    description,
    visible,
  }: {
    returnType?: string[] | undefined;
  } & CommonSchemaProps): SchemaFromView<'scriptableVariableSelect'> => ({
    required,
    type: 'object',
    index,
    visible,
    view: {
      borderTop,
      noMarginTop,
      index,
      returnType,
      featureLevel,
      label,
      required,
      type: 'scriptableVariableSelect',
      layout,
      description,
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
    description,
    visible,
  }: CommonSchemaProps &
    ValueSchemaProps<IScript> & {
      richText?: boolean;
    }): SchemaFromView<'scriptableString'> => ({
    required,
    type: 'object',
    index,
    visible,
    value,
    view: {
      borderTop,
      noMarginTop,
      index,
      required,
      featureLevel,
      label,
      type: 'scriptableString',
      layout,
      richText,
      description,
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
    description,
    visible,
  }: CommonSchemaProps &
    ValueSchemaProps<IScript>): SchemaFromView<'scriptableBoolean'> => ({
    required,
    type: 'object',
    index,
    visible,
    value,
    view: {
      borderTop,
      noMarginTop,
      index,
      featureLevel,
      label,
      required,
      type: 'scriptableBoolean',
      layout,
      description,
    },
  }),
  /** @deprecated */
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
    controls,
    description,
    visible,
  }: {
    itemSchema: any;
    userOnChildAdd?: (value?: any) => any;
    requiredItems?: boolean;
    itemType?: TYPESTRING;
    highlight?: boolean;
    sortable?: boolean;
    controls?: React.ReactNode;
  } & Omit<CommonSchemaProps, 'noMarginTop'>): SchemaFromView<'array'> => ({
    required,
    items: {
      properties: itemSchema,
      required: requiredItems,
      type: itemType,
    },
    type: 'array',
    index,
    visible,
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
      controls,
      description,
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
    description,
    visible,
  }: {
    mode?: ScriptMode;
  } & CommonSchemaProps &
    ValueSchemaProps<Statement>): SchemaFromView<'statement'> => ({
    required,
    type: 'object',
    index,
    visible,
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
      description,
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
    description,
    visible,
  }: {
    choices?: HashListChoices;
    objectViewStyle?: boolean;
    cleaning?: CleaningHashmapMethods;
  } & CommonSchemaProps &
    ValueSchemaProps<object>): SchemaFromView<'hashlist'> => ({
    required,
    type: 'object',
    value,
    index,
    visible,
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
      description,
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
    description,
    visible,
  }: {
    pickType?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<IAbstractContentDescriptor>): SchemaFromView<'file'> => ({
    required,
    type: 'object',
    value,
    index,
    visible,
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
      description,
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
    description,
    visible,
  }: {
    pickType?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<string>): SchemaFromView<'path'> => ({
    required,
    type: 'string',
    value,
    index,
    visible,
    view: {
      pickType,
      filter,
      featureLevel,
      index,
      label,
      type: 'path',
      layout,
      borderTop,
      noMarginTop,
      description,
    },
  }),
  scriptPath: ({
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
    description,
    visible,
  }: {
    pickType?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<string>): SchemaFromView<'scriptablepath'> => ({
    required,
    type: 'object',
    value,
    index,
    visible,
    view: {
      pickType,
      filter,
      featureLevel,
      index,
      label,
      required,
      type: 'scriptablepath',
      layout,
      borderTop,
      noMarginTop,
      description,
    },
  }),
  scriptable: ({
    label,
    required = false,
    featureLevel = 'DEFAULT',
    valueType,
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    description,
    visible,
    literalSchema,
    scriptProps,
    currentLanguage,
    readOnly,
    onLanguage,
    borderBottom,
  }: CommonSchemaProps &
    ScriptableViewView & {
      valueType?: TYPESTRING | TYPESTRING[];
    }): SchemaFromView<'scriptable'> => ({
    required,
    type:
      valueType != null
        ? Array.isArray(valueType)
          ? ['object', ...valueType]
          : ['object', valueType]
        : 'object',
    index,
    visible,
    view: {
      featureLevel,
      index,
      label,
      literalSchema,
      scriptProps,
      borderBottom,
      currentLanguage,
      onLanguage,
      readOnly,
      type: 'scriptable',
      layout,
      borderTop,
      noMarginTop,
      description,
    },
  }),
  nupple: ({
    label,
    required = false,
    featureLevel = 'DEFAULT',
    index = 0,
    layout,
    borderTop,
    noMarginTop,
    description,
    visible,
    currentLanguage,
    readOnly,
    onLanguage,
    borderBottom,
    itemsSchema,
  }: CommonSchemaProps & NuppleView): SchemaFromView<'nupple'> => ({
    required,
    type: 'array',
    index,
    visible,
    view: {
      itemsSchema,
      featureLevel,
      index,
      label,
      borderBottom,
      currentLanguage,
      onLanguage,
      readOnly,
      type: 'nupple',
      layout,
      borderTop,
      noMarginTop,
      description,
    },
  }),
} as const;

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
    description,
    visible,
  }: {
    properties?: { [key: string]: AvailableSchemas };
  } & CommonSchemaProps &
    ValueSchemaProps<object>) =>
    ({
      description: 'ObjectSchema',
      properties,
      value,
      required,
      type: 'object',
      index,
      visible,
      view: {
        featureLevel,
        index,
        label,
        layout,
        borderTop,
        noMarginTop,
        description,
      },
      // Force casting return type as JSONinput will do actually return the good props to object view (after computing these one)
    } as SchemaFromView<'object'>),
} as const;

export const schemaProps = {
  ...simpleSchemaProps,
  ...objectSchemaProps,
} as const;

/** used to expose schemaProps helpers in client scripts */
export type SchemaPropsType = typeof schemaProps;
