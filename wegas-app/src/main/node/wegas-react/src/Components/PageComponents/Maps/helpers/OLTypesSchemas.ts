import { AvailableSchemas } from '../../../../Editor/Components/FormView';
import { schemaProps } from '../../tools/schemaProps';

export const extentSchema: (label?: string) => AvailableSchemas = (
  label = 'Extent',
) => ({
  type: 'array',
  view: {
    type: 'nupple',
    label,
    itemsSchema: {
      left: schemaProps.number({
        required: true,
        label: 'left',
        layout: 'shortInline',
      }),
      bottom: schemaProps.number({
        required: true,
        label: 'bottom',
        layout: 'shortInline',
      }),
      right: schemaProps.number({
        required: true,
        label: 'right',
        layout: 'shortInline',
      }),
      top: schemaProps.number({
        required: true,
        label: 'top',
        layout: 'shortInline',
      }),
    },
  },
});

export const pointSchema: (label?: string) => AvailableSchemas = (
  label = 'Point',
) => ({
  type: 'array',
  view: {
    type: 'nupple',
    label,
    itemsSchema: {
      x: schemaProps.number({
        required: true,
        label: 'x',
        layout: 'shortInline',
      }),
      y: schemaProps.number({
        required: true,
        label: 'y',
        layout: 'shortInline',
      }),
    },
  },
});

export const mapSchema: Record<string, AvailableSchemas> = {
  mapOptions: schemaProps.scriptable({
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
            schema: extentSchema(),
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
  }),
};

export const wegasImageLayerSchema: Record<string, AvailableSchemas> = {
  layer: {
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
  },
};

export const wegasTileLayerSchema: Record<string, AvailableSchemas> = {
  layer: {
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
  },
};

export const wegasVectorLayerSchema: Record<string, AvailableSchemas> = {
  layer: {
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
  },
};

const colorSchema = (label: string) =>
  schemaProps.scriptable({
    valueType: 'string',
    required: false,
    label,
    scriptProps: {
      language: 'TypeScript',
      returnType: [
        'number',
        'number[]',
        'string',
        'CanvasPattern',
        'CanvasGradient',
        'undefined',
      ],
    },
    literalSchema: schemaProps.string({
      label,
      required: false,
    }),
  });

export const fillStyleSchema: Record<string, AvailableSchemas> = {
  layer: {
    type: 'object',
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'FillStyle' }),
      color: colorSchema('Color'),
    },
  },
};

export const strokeStyleSchema: Record<string, AvailableSchemas> = {
  layer: {
    type: 'object',
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'StrokeStyle' }),
      color: colorSchema('Color'),
      width: schemaProps.number({ label: 'Width', required: false }),
      lineCap: schemaProps.select({
        label: 'Line cap',
        values: ['butt', 'round', 'square'],
        value: 'round',
      }),
      lineJoin: schemaProps.select({
        label: 'Line join',
        values: ['bever', 'round', 'miter'],
        value: 'round',
      }),
      lineDash: schemaProps.number({
        label: 'Line dash pattern',
        required: false,
      }),
      lineDashOffset: {
        type: 'array',
        items: schemaProps.number({ label: 'Dash' }),
        view: {
          label: 'Line dash offset',
          type: 'array',
        },
      },
      miterLimit: schemaProps.number({ label: 'Miter limit', value: 10 }),
    },
  },
};

const sharedStyleSchema: Record<string, AvailableSchemas> = {
  rotateWithView: schemaProps.boolean({
    label: 'Rotate with view',
    required: true,
  }),
  rotation: schemaProps.number({ label: 'Rotation', required: true }),
  scale: pointSchema('Scale'),
  displacement: pointSchema('Displacement'),
};

export const imageStyleSchema: Record<string, AvailableSchemas> = {
  layer: {
    type: 'object',
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'ImageStyle' }),
      color: colorSchema('Color'),
      width: schemaProps.number({ label: 'Width', required: false }),
      lineCap: schemaProps.select({
        label: 'Line cap',
        values: ['butt', 'round', 'square'],
        value: 'round',
      }),
      lineJoin: schemaProps.select({
        label: 'Line join',
        values: ['bever', 'round', 'miter'],
        value: 'round',
      }),
      lineDash: schemaProps.number({
        label: 'Line dash pattern',
        required: false,
      }),
      lineDashOffset: {
        type: 'array',
        items: schemaProps.number({ label: 'Dash' }),
        view: {
          label: 'Line dash offset',
          type: 'array',
        },
      },
      miterLimit: schemaProps.number({ label: 'Miter limit', value: 10 }),
    },
  },
};
