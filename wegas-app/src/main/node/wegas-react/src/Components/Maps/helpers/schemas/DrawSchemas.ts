import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { styleObjectSchema } from './StyleSchemas';

export const drawSchema = schemaProps.hashlist({
  label: 'Draw options',
  choices: [
    {
      label: 'Drawable layers',
      value: {
        prop: 'layers',
        schema: schemaProps.callback({
          label: 'Layer Filter',
          callbackProps: {
            args: [['layer', ['any']]],
            returnType: ['boolean'],
          },
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
      label: 'Draw type',
      value: {
        prop: 'type',
        schema: schemaProps.scriptable({
          label: 'Draw',
          scriptProps: {
            language: 'TypeScript',
            returnType: ["'Point' | 'LineString' | 'Polygon'"],
          },
          literalSchema: schemaProps.select({
            label : 'Shape type',
            values : ['Point', 'LineString', 'Polygon']
          }),
        }),
      },
    },
    {
      label: 'On Draw End',
      value: {
        prop: 'onDrawEnd',
        schema: schemaProps.callback({
          label: 'on Draw End',
          callbackProps: {
            args: [['event', ['any']]],
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
          label: 'on Draw Start',
          callbackProps: {
            args: [['event', ['any']]],
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
          label: 'on Draw Abort',
          callbackProps: {
            args: [['event', ['any']]],
            returnType: ['void'],
          },
        }),
      },
    },
  ],
});
