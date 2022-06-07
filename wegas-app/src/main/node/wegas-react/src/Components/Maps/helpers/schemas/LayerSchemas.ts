import { AvailableSchemas } from '../../../../Editor/Components/FormView';
import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { extentSchema, pointSchema, projectionSchema } from './HelperSchemas';

export const wegasImageLayerSourceSchema: AvailableSchemas = {
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
            code: projectionSchema(),
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

export const wegasTileLayerSourceSchema: AvailableSchemas = {
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

export const wegasPredefinedLayerSourceSchema: AvailableSchemas = {
  type: 'object',
  properties: {
    type: schemaProps.hidden({ type: 'string', value: 'PredefinedLayer' }),
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

export const wegasVectorLayerSourceSchema: AvailableSchemas = {
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
    sourceProjection: projectionSchema('Source projection'),
    useSpatialIndex: schemaProps.boolean({
      label: 'Use spatial index',
      value: true,
    }),
  },
};

const sharedLayerProps = [
  {
    label: 'Classname',
    value: {
      prop: 'classname',
      schema: schemaProps.string({ label: 'Classname' }),
    },
  },
  {
    label: 'Opacity',
    value: {
      prop: 'opacity',
      schema: schemaProps.number({ value: 1, label: 'Opacity' }),
    },
  },
  {
    label: 'Visible',
    value: {
      prop: 'visible',
      schema: schemaProps.boolean({ value: true, label: 'Visible' }),
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
    label: 'Z-Index',
    value: {
      prop: 'zIndex',
      schema: schemaProps.number({ label: 'Z-Index' }),
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
    label: 'Max resolution',
    value: {
      prop: 'maxResolution',
      schema: schemaProps.number({ label: 'Max resolution' }),
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
    label: 'Max zoom',
    value: {
      prop: 'maxZoom',
      schema: schemaProps.number({ label: 'Max zoom' }),
    },
  },
];

export const wegasVectorLayerPropsSchema: AvailableSchemas =
  schemaProps.scriptable({
    label: 'Layer properties',
    scriptProps: {
      language: 'TypeScript',
      returnType: ['VectorLayerProps'],
    },
    literalSchema: schemaProps.hashlist({
      choices: [
        ...sharedLayerProps,
        {
          label: 'Render buffer',
          value: {
            prop: 'renderBuffer',
            schema: schemaProps.number({ value: 100, label: 'Render buffer' }),
          },
        },
        {
          label: 'Declutter',
          value: {
            prop: 'declutter',
            schema: schemaProps.boolean({ label: 'Declutter' }),
          },
        },
        {
          label: 'Background color',
          value: {
            prop: 'background',
            schema: schemaProps.string({ label: 'Background color' }),
          },
        },
        {
          label: 'Update while animating',
          value: {
            prop: 'updateWhileAnimating',
            schema: schemaProps.boolean({
              value: false,
              label: 'Update while animating',
            }),
          },
        },
        {
          label: 'Update while interacting',
          value: {
            prop: 'updateWhileInteracting',
            schema: schemaProps.boolean({
              value: false,
              label: 'Update while interacting',
            }),
          },
        },
      ],
    }),
  });

export const wegasImageLayerPropsSchema: AvailableSchemas =
  schemaProps.scriptable({
    label: 'Layer properties',
    scriptProps: {
      language: 'TypeScript',
      returnType: ['SharedLayerProps'],
    },
    literalSchema: schemaProps.hashlist({
      choices: sharedLayerProps,
    }),
  });

export const wegasTileLayerPropsSchema: AvailableSchemas =
  schemaProps.scriptable({
    label: 'Layer properties',
    scriptProps: {
      language: 'TypeScript',
      returnType: ['TileLayerProps'],
    },
    literalSchema: schemaProps.hashlist({
      choices: [
        ...sharedLayerProps,
        {
          label: 'Preload',
          value: {
            prop: 'preload',
            schema: schemaProps.number({ value: 0, label: 'Preload' }),
          },
        },
        {
          label: 'Use interim tiles on error',
          value: {
            prop: 'useInterimTilesOnError',
            schema: schemaProps.boolean({
              value: true,
              label: 'Use interim tiles on error',
            }),
          },
        },
      ],
    }),
  });

export const onLayerReadySchema = schemaProps.callback({
  label: 'On layer ready',
  required: false,
  callbackProps: {
    args: [
      ['layer', ['any']],
      ['map', ['any']],
    ],
    returnType: ['void'],
  },
});
