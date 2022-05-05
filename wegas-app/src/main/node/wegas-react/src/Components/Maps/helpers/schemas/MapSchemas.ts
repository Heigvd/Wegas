import { AvailableSchemas } from '../../../../Editor/Components/FormView';
import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { extentSchema, pointSchema } from './HelperSchemas';

export const mapSchema: AvailableSchemas = schemaProps.scriptable({
  label: 'View options',
  scriptProps: {
    language: 'TypeScript',
    returnType: ['unknown'],
  },
  literalSchema: schemaProps.hashlist({
    label: 'View options',
    choices: [
      {
        label: 'Center',
        value: {
          prop: 'center',
          schema: pointSchema('Center'),
        },
      },
      {
        label: 'Projection',
        value: {
          prop: 'projection',
          schema: schemaProps.string({ label: 'Projection' }),
        },
      },
      {
        label: 'Extent',
        value: {
          prop: 'extent',
          schema: extentSchema('Extent'),
        },
      },
      {
        label: 'Max resolution',
        value: {
          prop: 'maxResolution',
          schema: schemaProps.number({ label: 'Max resolution' }),
        },
      },
      {
        label: 'Min resolution',
        value: {
          prop: 'minResolution',
          schema: schemaProps.number({ label: 'Min resolution' }),
        },
      },
      {
        label: 'Resolution',
        value: {
          prop: 'resolution',
          schema: schemaProps.number({ label: 'Resolution' }),
        },
      },
      {
        label: 'Max zoom',
        value: {
          prop: 'maxZoom',
          schema: schemaProps.number({ label: 'Max zoom' }),
        },
      },
      {
        label: 'Min zoom',
        value: {
          prop: 'minZoom',
          schema: schemaProps.number({ label: 'Min zoom' }),
        },
      },
      {
        label: 'Zoom',
        value: {
          prop: 'zoom',
          schema: schemaProps.number({ label: 'Zoom' }),
        },
      },
    ],
    objectViewStyle: true,
  }),
});
