import { emptyStatement, Statement } from '@babel/types';
import { TYPESTRING } from 'jsoninput/typings/types';
import * as React from 'react';
import { IAbstractContentDescriptor, IScript } from 'wegas-ts-api';
import {
  AvailableSchemas,
  DEFINED_VIEWS,
  SchemaFromView,
} from '../../../Editor/Components/FormView';
import { WegasMethod } from '../../../Editor/editionConfig';
import { createScript } from '../../../Helper/wegasEntites';
import { Choices } from '../../Selector';

// For tests only
//const simpleSchemaProps: SimpleSchemaPropsType = {

const simpleSchemaProps = {
  hidden: ({
    required = false,
    type = 'array',
    index = 0,
  }: {
    type?: TYPESTRING | TYPESTRING[];
  } & SimpleSchemaProps): SchemaFromView<'hidden'> => ({
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
    ValueSchemaProps<boolean>): SchemaFromView<'boolean'> => ({
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
    ValueSchemaProps<number>): SchemaFromView<'number'> => ({
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
    }): SchemaFromView<'string'> => ({
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
    ValueSchemaProps<string>): SchemaFromView<'script'> => ({
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
    returnType?: string[];
    language?: ScriptLanguage;
    args?: [string, string[]][];
    scriptContext?: ScriptContext;
  } & CommonSchemaProps &
    ValueSchemaProps<string>): SchemaFromView<'customscript'> => ({
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
    ValueSchemaProps<{} | string>): SchemaFromView<'code'> => ({
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
  }: CommonSchemaProps): SchemaFromView<'pageselect'> => {
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
  }: CommonSchemaProps): SchemaFromView<'pagesloaderselect'> => {
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
  }: CommonSchemaProps): SchemaFromView<'thememodeselect'> => {
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
  } & CommonSchemaProps): SchemaFromView<'variableselect'> => ({
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
      required,
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
  } & CommonSchemaProps): SchemaFromView<'treeselect'> => ({
    required,
    type,
    index,
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
    returnType?: string[] | undefined;
  } & CommonSchemaProps): SchemaFromView<'scriptableVariableSelect'> => ({
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
      required,
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
    }): SchemaFromView<'scriptableString'> => ({
    required,
    type: 'object',
    index,
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
    ValueSchemaProps<IScript>): SchemaFromView<'scriptableBoolean'> => ({
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
      required,
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
    controls,
  }: {
    itemSchema: {};
    userOnChildAdd?: (value?: {}) => {};
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
    ValueSchemaProps<Statement>): SchemaFromView<'statement'> => ({
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
    ValueSchemaProps<object>): SchemaFromView<'hashlist'> => ({
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
    ValueSchemaProps<IAbstractContentDescriptor>): SchemaFromView<'file'> => ({
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
  }: {
    pickType?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<string>): SchemaFromView<'path'> => ({
    required,
    type: 'string',
    value,
    index,
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
  }: {
    pickType?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<string>): SchemaFromView<'scriptablepath'> => ({
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
      required,
      type: 'scriptablepath',
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
    properties?: { [key: string]: AvailableSchemas };
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

/** used to expose schemaProps helpers in client scripts */
export type SchemaPropsType = typeof schemaProps;
