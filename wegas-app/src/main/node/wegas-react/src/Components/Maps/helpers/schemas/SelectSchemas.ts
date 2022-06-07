import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { styleObjectSchema } from './StyleSchemas';

export const selectSchema = schemaProps.hashlist({
  label: 'Select options',
  choices: [
    {
      label: 'Selectable layers',
      value: {
        prop: 'layers',
        schema: schemaProps.code({
          label: 'Selectable layers',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['unknown'],
          },
        }),
      },
    },
    {
      label: 'Selection style',
      value: {
        prop: 'style',
        schema: styleObjectSchema,
      },
    },
    {
      label: 'Select multi features (overlapping)',
      value: {
        prop: 'multi',
        schema: schemaProps.scriptable({
          label: 'Select multi features (overlapping)',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['boolean'],
          },
          literalSchema: schemaProps.boolean({}),
        }),
      },
    },
    {
      label: 'Filter',
      value: {
        prop: 'filter',
        schema: schemaProps.callback({
          label: 'Filter',
          callbackProps: {
            args: [['feature', ['any']]],
            returnType: ['boolean'],
          },
        }),
      },
    },
    {
      label: 'Features to add during selection',
      value: {
        prop: 'features',
        schema: schemaProps.code({
          label: 'Features to add during selection',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['unknown[]'],
          },
        }),
      },
    },
    {
      label: 'Hit tolerance',
      value: {
        prop: 'hitTolerance',
        schema: schemaProps.scriptable({
          label: 'Hit tolerance',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
    {
      label: 'Condition',
      value: {
        prop: 'condition',
        schema: schemaProps.callback({
          label: 'Condition',
          callbackProps: {
            args: [['event', ['any']]],
            returnType: ['boolean'],
          },
        }),
      },
    },
    {
      label: 'Add condition',
      value: {
        prop: 'addCondition',
        schema: schemaProps.callback({
          label: 'Add condition',
          callbackProps: {
            args: [['event', ['any']]],
            returnType: ['boolean'],
          },
        }),
      },
    },
    {
      label: 'Remove condition',
      value: {
        prop: 'removeCondition',
        schema: schemaProps.callback({
          label: 'Remove condition',
          callbackProps: {
            args: [['event', ['any']]],
            returnType: ['boolean'],
          },
        }),
      },
    },
    {
      label: 'Toggle condition',
      value: {
        prop: 'toggleCondition',
        schema: schemaProps.callback({
          label: 'Toggle condition',
          callbackProps: {
            args: [['event', ['any']]],
            returnType: ['boolean'],
          },
        }),
      },
    },
    {
      label: 'on Select',
      value: {
        prop: 'onSelect',
        schema: schemaProps.callback({
          label: 'on Select',
          callbackProps: {
            args: [['event', ['any']]],
            returnType: ['boolean'],
          },
        }),
      },
    },
  ],
});
