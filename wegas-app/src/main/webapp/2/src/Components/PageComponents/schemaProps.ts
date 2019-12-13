import { CodeLanguage } from '../../Editor/Components/FormView/Script';

type SchemaPrimitives =
  | 'boolean'
  | 'number'
  | 'string'
  | 'object'
  | 'array'
  | 'never'
  | 'void'
  | 'undefined'
  | 'unknown';

type SchemaLayouts = 'inline' | 'shortInline';

export const schemaProps = {
  hidden: (
    isChildren: boolean = false,
    type: SchemaPrimitives = 'array',
    required: boolean = true,
  ) => ({
    required,
    isChildren,
    type,
    view: {
      index: 0,
      type: 'hidden',
    },
  }),
  boolean: (
    label: string,
    required: boolean = true,
    value?: boolean,
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
  ) => ({
    required,
    type: 'boolean',
    value,
    view: {
      readOnly,
      featureLevel,
      index,
      label,
    },
  }),
  number: (
    label: string,
    required: boolean = true,
    value?: number,
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout: SchemaLayouts = 'shortInline',
  ) => ({
    featureLevel,
    required,
    type: 'number',
    value,
    view: {
      featureLevel,
      index,
      label,
      layout,
      readOnly,
      type: 'number',
    },
  }),
  string: (
    label: string,
    required: boolean = true,
    value?: string,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
    layout: SchemaLayouts = 'shortInline',
  ) => ({
    required,
    type: 'string',
    value,
    view: {
      layout,
      featureLevel,
      index,
      label,
    },
  }),
  script: (
    label: string,
    required: boolean = true,
    scriptableClassFilter: WegasScriptEditorReturnTypeName[] = [],
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
    view: {
      featureLevel,
      index,
      label,
      mode: 'SET',
      type: 'script',
      scriptableClassFilter,
    },
  }),
  code: (
    label: string,
    required: boolean = true,
    language: CodeLanguage = 'JavaScript',
    value?: string,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
  ) => ({
    required,
    type: 'object',
    value,
    view: {
      featureLevel,
      index,
      label,
      language,
      type: 'code',
    },
  }),
  select: (
    label: string,
    values: readonly string[],
    required: boolean = true,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
  ) => ({
    enum: values,
    required,
    type: 'string',
    view: {
      choices: values.map(v => v && { label: v, value: v }),
      featureLevel,
      index,
      label,
      type: 'select',
    },
  }),
  variable: (
    label: string,
    classFilter: WegasClassNames[] = [],
    required: boolean = true,
    featureLevel: FeatureLevel = 'DEFAULT',
    index: number = 0,
  ) => ({
    required,
    type: 'string',
    view: {
      classFilter,
      featureLevel,
      index,
      label,
      type: 'variableselect',
    },
  }),
};
