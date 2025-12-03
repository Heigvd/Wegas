import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { styleObjectSchema } from './StyleSchemas';

export const drawSchema = schemaProps.hashlist({
  label: 'Draw options',
  choices: [
    {
      label: 'Geometry type',
      value: {
        prop: 'type',
        schema: schemaProps.scriptable({
          label: 'Draw',
          scriptProps: {
            language: 'TypeScript',
            returnType: ["DrawType"],
          },
          literalSchema: schemaProps.select({
            label : 'Shape type',
            values : ['Point', 'LineString', 'Polygon', 'Circle']
          }),
        }),
      },
    },
    {
      label: 'Drawing style',
      value: {
        prop: 'style',
        schema: styleObjectSchema,
      },
    },
    {
      label: 'On Draw End',
      value: {
        prop: 'onDrawEnd',
        schema: schemaProps.callback({
          label: 'On Draw End',
          callbackProps: {
            args: [['event', ['DrawEvent']]],
            returnType: ['void'],
          },
        }),
      },
    },
    {
      label: 'On Draw start',
      value: {
        prop: 'onDrawStart',
        schema: schemaProps.callback({
          label: 'On Draw Start',
          callbackProps: {
            args: [['event', ['DrawEvent']]],
            returnType: ['void'],
          },
        }),
      },
    },
    {
      label: 'On Draw Abort',
      value: {
        prop: 'onDrawAbort',
        schema: schemaProps.callback({
          label: 'On Draw Abort',
          callbackProps: {
            args: [['event', ['DrawEvent']]],
            returnType: ['void'],
          },
        }),
      },
    },
    {
      label: 'Min points',
      value: {
        prop: 'minPoints',
        schema: schemaProps.number({ value: undefined, label: 'Minimum points' }),
      },
    },
    {
      label: 'Max points',
      value: {
        prop: 'maxPoints',
        schema: schemaProps.number({ value: undefined, label: 'Maximum points' }),
      },
    },
  ],
});
