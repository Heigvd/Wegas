import { store } from '../../data/store';
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
    value: string = '',
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    required: boolean = true,
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
    readOnly: boolean = false,
    featureLevel: FeatureLevel = 'DEFAULT',
    required: boolean = true,
    index: number = 0,
    layout: SchemaLayouts = 'shortInline',
  ) => ({
    featureLevel,
    required,
    type: 'number',
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
    value: string = '',
    featureLevel: FeatureLevel = 'DEFAULT',
    required: boolean = true,
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
    language?: 'JavaScript' | 'JSON' | 'TypeScript' | 'CSS',
    value: string = '',
    featureLevel: FeatureLevel = 'DEFAULT',
    required: boolean = true,
    index: number = 0,
  ) => ({
    required,
    type: 'object',
    value: {
      '@class': 'Script',
      value,
      language,
    },
    view: {
      featureLevel,
      index,
      label,
      mode: 'SET',
      type: 'script',
    },
  }),
  code: (
    label: string,
    language: CodeLanguage = 'JavaScript',
    value: string = '',
    featureLevel: FeatureLevel = 'DEFAULT',
    required: boolean = true,
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
  variable: (
    label: string,
    variables = store.getState().variableDescriptors,
    featureLevel: FeatureLevel = 'DEFAULT',
    required: boolean = true,
    index: number = 0,
  ) => ({
    enum: Object.values(variables).map(v => v && v.name),
    required,
    type: 'string',
    view: {
      choices: Object.values(variables).map(
        v => v && { label: v.name, value: v.name },
      ),
      featureLevel,
      index,
      label,
      type: 'select',
    },
  }),
};
