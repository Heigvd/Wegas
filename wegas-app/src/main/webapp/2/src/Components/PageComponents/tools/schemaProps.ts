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
import { IAsyncSelectProps } from '../../../Editor/Components/FormView/Select';
import { PageSelectProps } from '../../../Editor/Components/FormView/PageSelect';
import { Item } from '../../../Editor/Components/Tree/TreeSelect';
import {
  TreeVariableSelectProps,
  ScripableVariableSelectProps,
  TreeVSelectProps,
} from '../../../Editor/Components/FormView/TreeVariableSelect';
import { IArrayProps } from '../../../Editor/Components/FormView/Array';
import { StatementViewProps } from '../../../Editor/Components/FormView/Script/Expressions/ExpressionEditor';

// type SchemaPrimitive =
//   | 'boolean'
//   | 'number'
//   | 'string'
//   | 'object'
//   | 'array'
//   | 'never'
//   | 'void'
//   | 'undefined'
//   | 'unknown';

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

export const schemaProps = {
  hidden: (
    required: boolean = true,
    type: TYPESTRING | TYPESTRING[] = 'array',
    index: number = 0,
  ): TypedProps<WidgetProps.BaseProps> => ({
    required,
    type,
    index,
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
  ): TypedProps<BooleanProps> => ({
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
      type: 'boolean',
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
  ): TypedProps<StringInputProps> => ({
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
  ): TypedProps<StringInputProps> => ({
    required,
    type: 'string',
    value,
    index,
    view: {
      index,
      layout,
      featureLevel,
      label,
      type: 'string',
    },
  }),
  custom: <T extends keyof typeof DEFINED_VIEWS>(
    label?: string,
    required: boolean = true,
    type?: WegasMethod['returns'],
    viewType?: T,
    value?: number,
    index: number = 0,
    layout?: SchemaLayout,
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
  ) =>
    /* TODO : Improve  */
    /*: TypedProps<Parameters<typeof DEFINED_VIEWS[T]>[0]>*/
    ({
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
    mode: ScriptMode = 'SET',
    language?: 'JavaScript' | 'JSON' | 'TypeScript' | 'CSS',
    value?: string,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ): TypedProps<ScriptProps> => ({
    required,
    type: 'object',
    value: {
      '@class': 'Script',
      content: value || '',
      language: language || 'JavaScript',
    },
    index,
    view: {
      index,
      featureLevel,
      label,
      mode,
      type: 'script',
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
  ): TypedProps<CodeProps> => ({
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
    returnType: TYPESTRING | TYPESTRING[] = 'string',
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ): TypedProps<IAsyncSelectProps> & { enum: readonly unknown[] } => {
    let enumerator: readonly unknown[] = [];
    let choices: SelectItem[] = [];
    if (values.length > 0) {
      if (typeof values[0] === 'string') {
        enumerator = values;
        choices = values.map((v: string) => ({ label: v, value: v }));
      } else {
        enumerator = values.map((v: SelectItem) => v.value);
        choices = values as SelectItem[];
      }
    }

    return {
      enum: enumerator,
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
        undefined: !required,
      },
    };
  },
  pageSelect: (
    label?: string,
    required: boolean = true,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ): TypedProps<PageSelectProps> => {
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
    items?: Item<string>[],
  ): TypedProps<TreeVariableSelectProps> => ({
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
  tree: <T>(
    label?: string,
    items?: Item<T>[],
    required: boolean = true,
    classFilter: WegasClassNames[] = [],
    type: TYPESTRING | TYPESTRING[] = 'string',
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ): TypedProps<TreeVSelectProps<T>> => ({
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
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ): TypedProps<ScripableVariableSelectProps> => ({
    required,
    type: 'object',
    index,
    view: {
      index,
      classFilter,
      featureLevel,
      label,
      type: 'scriptableVariableSelect',
      layout,
    },
  }),
  array: (
    label?: string,
    itemShema: {} = {},
    userOnChildAdd?: (value?: {}) => void,
    // onChildRemove?: (index: number) => void,
    requiredItems: boolean = false,
    itemType: TYPESTRING = 'object',
    required: boolean = true,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
    highlight: boolean = true,
    sortable: boolean = false,
  ): TypedProps<IArrayProps> => ({
    required,
    items: {
      // description:"shemaprops.array.items",
      properties: itemShema,
      required: requiredItems,
      type: itemType,
    },
    // onChildRemove,
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
      userOnChildAdd,
    },
  }),
  statement: (
    label?: string,
    required: boolean = true,
    mode: ScriptMode = 'SET',
    value: Statement = emptyStatement(),
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout?: SchemaLayout,
  ): TypedProps<StatementViewProps> => ({
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
      mode,
    },
  }),
};
