import { store } from '../../data/store';
import { SrcEditorProps } from '../../Editor/Components/ScriptEditors/SrcEditor';
import { CodeLanguage } from '../../Editor/Components/FormView/Script';

export const schemaProps = {
  string: (
    label: string,
    value: string = '',
    featureLevel: FeatureLevel = 'DEFAULT',
    required: boolean = true,
    index: number = 0,
  ) => ({
    required,
    type: 'string',
    value,
    view: {
      featureLevel,
      index,
      label,
    },
  }),
  boolean: (
    label: string,
    value: string = '',
    featureLevel: FeatureLevel = 'DEFAULT',
    required: boolean = true,
    index: number = 0,
  ) => ({
    required,
    type: 'boolean',
    value,
    view: {
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
