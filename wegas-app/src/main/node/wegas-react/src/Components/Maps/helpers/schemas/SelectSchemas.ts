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
        schema: schemaProps.code({
          label: 'Filter',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['(feature:any)=>boolean'],
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
        schema: schemaProps.code({
          label: 'Condition',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['(event:any)=>boolean'],
          },
        }),
      },
    },
    {
      label: 'Add condition',
      value: {
        prop: 'addCondition',
        schema: schemaProps.code({
          label: 'Add condition',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['(event:any)=>boolean'],
          },
        }),
      },
    },
    {
      label: 'Remove condition',
      value: {
        prop: 'removeCondition',
        schema: schemaProps.code({
          label: 'Remove condition',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['(event:any)=>boolean'],
          },
        }),
      },
    },
    {
      label: 'Toggle condition',
      value: {
        prop: 'toggleCondition',
        schema: schemaProps.code({
          label: 'Toggle condition',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['(event:any)=>boolean'],
          },
        }),
      },
    },
    {
      label: 'on Select',
      value: {
        prop: 'onSelect',
        schema: schemaProps.code({
          label: 'on Select',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['(event:any)=>void'],
          },
        }),
      },
    },
  ],
});
