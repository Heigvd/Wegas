import { WegasMethod } from '../../../Editor/editionConfig';
import {
  ScriptMode,
  CodeLanguage,
} from '../../../Editor/Components/FormView/Script/Script';

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
    },
  }),
  number: (
    label?: string,
    required: boolean = true,
    value?: number,
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout: SchemaLayout = 'shortInline',
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
    layout: SchemaLayout = 'shortInline',
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
    value?: number,
    index: number = 0,
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    layout: SchemaLayout = 'shortInline',
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
      type,
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
    },
  }),
  code: (
    label?: string,
    required: boolean = true,
    language: CodeLanguage = 'JavaScript',
    value?: string,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
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
    },
  }),
  select: (
    label?: string,
    required: boolean = true,
    values: readonly (string | SelectItem)[] = [],
    returnType: SchemaPrimitive = 'string',
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
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
      },
    };
  },
  pageSelect: (
    label?: string,
    required: boolean = true,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
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
      },
    };
  },
  variable: (
    label?: string,
    required: boolean = true,
    classFilter: WegasClassNames[] = [],
    scriptable: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
  ) => ({
    required,
    type: 'string',
    index,
    view: {
      index,
      classFilter,
      featureLevel,
      label,
      scriptable,
      type: 'variableselect',
    },
  }),
  scriptVariable: (
    label?: string,
    required: boolean = true,
    classFilter: WegasClassNames[] = [],
    scriptable: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
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
    },
  }),
};
