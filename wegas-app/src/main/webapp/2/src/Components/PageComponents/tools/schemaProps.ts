import {
  ScriptMode,
  CodeLanguage,
} from '../../../Editor/Components/FormView/Script/Script';
import { TYPESTRING } from 'jsoninput/typings/types';
import { DEFINED_VIEWS } from '../../../Editor/Components/FormView';
import { WegasMethod, WegasTypeString } from '../../../Editor/editionConfig';
import { Item } from '../../../Editor/Components/FormView/TreeVariableSelect';
import { emptyStatement, Statement } from '@babel/types';

type SchemaPrimitive =
  | 'boolean'
  | 'number'
  | 'string'
  | 'object'
  | 'array'
  | 'never'
  | 'void'
  | 'undefined'
  | 'unknown';

type SchemaLayout = 'inline' | 'shortInline';

export interface SelectItem {
  label: string;
  value: unknown;
}

export const schemaProps = {
  hidden: (required: boolean = true, type: SchemaPrimitive = 'array') => ({
    required,
    type,
    index: 0,
    view: {
      type: 'hidden',
    },
  }),
  boolean: (
    label?: string,
    required: boolean = true,
    value?: boolean,
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => ({
    required,
    type: 'boolean',
    value,
    index,
    view: {
      index,
      readOnly,
      featureLevel,
      label,
      layout,
    },
  }),
  number: (
    label?: string,
    required: boolean = true,
    value?: number,
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => ({
    featureLevel,
    required,
    type: 'number',
    value,
    index,
    view: {
      index,
      featureLevel,
      label,
      layout,
      readOnly,
      type: 'number',
    },
  }),
  string: (
    label?: string,
    required: boolean = true,
    value?: string,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => ({
    required,
    type: 'string',
    value,
    index,
    view: {
      index,
      layout,
      featureLevel,
      label,
    },
  }),
  custom: (
    label?: string,
    required: boolean = true,
    type?: WegasMethod['returns'],
    viewType?: keyof typeof DEFINED_VIEWS,
    value?: number,
    index: number = 0,
    layout?: SchemaLayout,
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
  ) => ({
    featureLevel,
    required,
    type,
    value,
    index,
    view: {
      index,
      featureLevel,
      label,
      layout,
      readOnly,
      type: viewType,
    },
  }),
  script: (
    label?: string,
    required: boolean = true,
    scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
    mode: ScriptMode = 'SET',
    language?: 'JavaScript' | 'JSON' | 'TypeScript' | 'CSS',
    value?: string,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => ({
    required,
    type: 'object',
    value:
      value !== undefined
        ? {
            '@class': 'Script',
            value,
            language,
          }
        : value,
    index,
    view: {
      index,
      featureLevel,
      label,
      mode,
      type: 'script',
      scriptableClassFilter,
      layout,
    },
  }),
  code: (
    label?: string,
    required: boolean = true,
    language: CodeLanguage = 'JavaScript',
    value?: string,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => ({
    required,
    type: 'object',
    value,
    index,
    view: {
      index,
      featureLevel,
      label,
      language,
      type: 'code',
      layout,
    },
  }),
  select: (
    label?: string,
    required: boolean = true,
    values: readonly (string | SelectItem)[] = [],
    returnType: SchemaPrimitive = 'string',
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => {
    let enumerated: readonly unknown[] = [];
    let choices: readonly SelectItem[] = [];
    if (values.length > 0) {
      if (typeof values[0] === 'string') {
        enumerated = values;
        choices = values.map((v: string) => ({ label: v, value: v }));
      } else {
        enumerated = values.map((v: SelectItem) => v.value);
        choices = values as SelectItem[];
      }
    }

    return {
      enum: enumerated,
      required,
      type: returnType,
      index,
      view: {
        index,
        choices,
        featureLevel,
        label,
        type: 'select',
        layout,
      },
    };
  },
  pageSelect: (
    label?: string,
    required: boolean = true,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => {
    return {
      required,
      type: 'object',
      index,
      view: {
        index,
        featureLevel,
        label,
        type: 'pageselect',
        layout,
      },
    };
  },
  variable: (
    label?: string,
    required: boolean = true,
    classFilter: WegasClassNames[] = [],
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
    items?: Item[],
  ) => ({
    required,
    type: 'string',
    index,
    view: {
      index,
      classFilter,
      featureLevel,
      label,
      type: 'variableselect',
      layout,
      items,
    },
  }),
  tree: (
    label?: string,
    items?: Item[],
    required: boolean = true,
    classFilter: WegasClassNames[] = [],
    type: WegasTypeString = 'string',
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => ({
    required,
    type,
    index,
    view: {
      index,
      classFilter,
      featureLevel,
      label,
      type: 'treeselect',
      layout,
      items,
    },
  }),
  scriptVariable: (
    label?: string,
    required: boolean = true,
    classFilter: WegasClassNames[] = [],
    scriptable: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => ({
    required,
    type: 'object',
    index,
    view: {
      index,
      classFilter,
      featureLevel,
      label,
      scriptable,
      type: 'scriptableVariableSelect',
      layout,
    },
  }),
  array: <T>(
    label?: string,
    itemShema: {} = {},
    onChildAdd?: (newChild: T) => void,
    onChildRemove?: (index: number) => void,
    requiredItems: boolean = false,
    itemType: TYPESTRING = 'object',
    required: boolean = true,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
    highlight: boolean = true,
    sortable: boolean = false,
  ) => ({
    required,
    items: {
      // description:"shemaprops.array.items",
      properties: itemShema,
      required: requiredItems,
      type: itemType,
    },
    onChildAdd,
    onChildRemove,
    type: 'array',
    index,
    view: {
      index,
      featureLevel,
      label,
      type: 'array',
      layout,
      highlight,
      sortable,
    },
  }),
  statement: (
    label?: string,
    required: boolean = true,
    scriptableClassFilter?: WegasScriptEditorReturnTypeName[],
    mode: ScriptMode = 'SET',
    value: Statement = emptyStatement(),
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ) => ({
    required,
    type: 'object',
    index,
    value,
    view: {
      index,
      featureLevel,
      label,
      type: 'statement',
      layout,
      scriptableClassFilter,
      mode,
    },
  }),
};
