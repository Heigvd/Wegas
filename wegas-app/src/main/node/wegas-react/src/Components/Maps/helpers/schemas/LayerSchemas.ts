import { AvailableSchemas } from '../../../../Editor/Components/FormView';
import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { extentSchema, pointSchema } from './HelperSchemas';

export const wegasImageLayerSchema: AvailableSchemas = {
  type: 'object',
  properties: {
    type: schemaProps.hidden({ type: 'string', value: 'ImageLayer' }),
    source: {
      type: 'object',
      properties: {
        type: schemaProps.hidden({ type: 'string', value: 'Static' }),
        url: schemaProps.scriptPath({ label: 'File', required: true }),
        projection: {
          type: 'object',
          view: {
            label: 'Projection',
          },
          properties: {
            code: schemaProps.string({ label: 'code', value: 'xkcd-image' }),
            units: schemaProps.select({
              label: 'Units',
              values: [
                'radians',
                'degrees',
                'ft',
                'm',
                'pixels',
                'tile-pixels',
                'us-ft',
              ],
            }),
            extent: extentSchema('Extent'),
          },
        },
        imageExtent: extentSchema('Image extent'),
        imageSize: pointSchema('Image size'),
      },
    },
  },
};

export const wegasTileLayerSchema: AvailableSchemas = {
  type: 'object',
  properties: {
    type: schemaProps.hidden({ type: 'string', value: 'TileLayer' }),
    source: {
      type: 'object',
      properties: {
        type: schemaProps.hidden({ type: 'string', value: 'Tiff' }),
        normalize: schemaProps.boolean({
          label: 'Normalize',
          required: false,
        }),
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: schemaProps.scriptPath({ label: 'File' }),
            },
          },
          view: {
            label: 'Sources',
            type: 'array',
          },
        },
      },
    },
  },
};

export const wegasVectorLayerSchema: AvailableSchemas = {
  type: 'object',
  properties: {
    type: schemaProps.hidden({ type: 'string', value: 'VectorLayer' }),
    dataType: schemaProps.select({
      label: 'Data type',
      values: ['OSM', 'GeoJSON'],
      value: 'GeoJSON',
    }),
    source: schemaProps.scriptable({
      valueType: 'string',
      label: 'Source',
      scriptProps: {
        language: 'TypeScript',
        returnType: ['string', 'object'],
      },
      literalSchema: schemaProps.path({
        label: 'Data file',
        required: false,
      }),
    }),
    sourceProjection: schemaProps.string({
      label: 'Source projection',
      required: false,
    }),
  },
};
