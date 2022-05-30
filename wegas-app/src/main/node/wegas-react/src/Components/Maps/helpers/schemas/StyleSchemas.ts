import { AvailableSchemas } from '../../../../Editor/Components/FormView';
import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { extentSchema } from './HelperSchemas';

export const fillStyleSchema: (required?: boolean) => AvailableSchemas =
  required => ({
    required,
    type: 'object',
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'FillStyle' }),
      color: schemaProps.string({ label: 'Fill color' }),
    },
  });

export const strokeStyleSchema: (required?: boolean) => AvailableSchemas =
  required => ({
    required,
    type: 'object',
    view: { label: 'Stroke' },
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'StrokeStyle' }),
      color: schemaProps.string({ label: 'Color' }),
      width: schemaProps.number({ label: 'Width', required: false }),
      lineCap: schemaProps.select({
        label: 'Line cap',
        values: ['butt', 'round', 'square'],
        value: 'round',
      }),
      lineJoin: schemaProps.select({
        label: 'Line join',
        values: ['bevel', 'round', 'miter'],
        value: 'round',
      }),
      lineDashOffset: schemaProps.number({
        label: 'Line dash offset',
        required: false,
      }),
      lineDash: {
        type: 'array',
        items: schemaProps.number({}),
        view: {
          label: 'Line dash pattern',
          type: 'array',
        },
      },
      miterLimit: schemaProps.number({ label: 'Miter limit', value: 10 }),
    },
  });

// const sharedStyleSchema: Record<string, AvailableSchemas> = {
//   opacity: schemaProps.number({ label: 'Opacity' }),
//   rotateWithView: schemaProps.boolean({
//     label: 'Rotate with view',
//   }),
//   rotation: schemaProps.number({ label: 'Rotation' }),
//   scale: pointSchema('Scale', false),
//   displacement: pointSchema('Displacement', false),
// };

export const imageStyleSchema: (required: boolean) => AvailableSchemas =
  required => ({
    required,
    type: 'object',
    view: { label: 'Image' },
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'CircleStyle' }),
      fill: fillStyleSchema(),
      stroke: strokeStyleSchema(),
      radius: schemaProps.number({ label: 'Radius', required: true }),
      // ...sharedStyleSchema,
    },
  });

export const textStyleSchema: (required: boolean) => AvailableSchemas =
  required => ({
    required,
    type: 'object',
    view: { label: 'Text' },
    properties: {
      type: schemaProps.hidden({ type: 'string', value: 'TextStyle' }),
      font: schemaProps.string({ label: 'Font', required: false }),
      maxAngle: schemaProps.number({ label: 'Max angle', required: false }),
      offsetX: schemaProps.number({ label: 'Offset X', required: false }),
      offsetY: schemaProps.number({ label: 'Offset Y', required: false }),
      overflow: schemaProps.boolean({ label: 'Overflow', required: false }),
      placement: schemaProps.select({
        label: 'Placement',
        required: false,
        values: ['point', 'line'],
      }),
      text: schemaProps.string({ label: 'Text', required: false }),
      textAlign: schemaProps.select({
        label: 'Text align',
        required: false,
        values: ['left', 'right', 'center', 'end', 'start'],
      }),
      textBaseline: schemaProps.select({
        label: 'Text baseline',
        required: false,
        values: [
          'bottom',
          'top',
          'middle',
          'alphabetic',
          'hanging',
          'ideographic',
        ],
      }),
      fill: fillStyleSchema(false),
      stroke: strokeStyleSchema(false),
      padding: extentSchema('Padding', false),
      // ...sharedStyleSchema,
    },
  });

export const styleObjectSchema: AvailableSchemas = {
  type: 'object',
  view: {
    label: 'Style',
    type: 'scriptablecallback',
    callbackProps: {
      args: [
        ['feature', ['any']],
        ['resolution', ['number']],
      ],
      returnType: ['LayerStyleObject', 'LayerStyleObject[]'],
    },
    literalSchema: schemaProps.hashlist({
      choices: [
        {
          label: 'Geometry',
          value: {
            prop: 'geometry',
            schema: schemaProps.select({
              label: 'Geometry',
              values: [
                'Point',
                'LineString',
                'LinearRing',
                'Polygon',
                'MultiPoint',
                'MultiLineString',
                'MultiPolygon',
                'GeometryCollection',
                'Circle',
              ],
            }),
          },
        },
        {
          label: 'Fill',
          value: {
            prop: 'fill',
            schema: fillStyleSchema(true),
          },
        },
        {
          label: 'Image',
          value: {
            prop: 'image',
            schema: imageStyleSchema(true),
          },
        },
        {
          label: 'Renderer',
          value: {
            prop: 'renderer',
            schema: schemaProps.code({
              label: 'Renderer',
              scriptProps: {
                args: [
                  [
                    'coordinates',
                    [
                      '[number,number] | [number,number][] | [number,number][][]',
                    ],
                  ],
                ],
                language: 'TypeScript',
                returnType: ['void'],
              },
            }),
          },
        },
        {
          label: 'Hit detection renderer',
          value: {
            prop: 'hitDetectionRenderer',
            schema: schemaProps.code({
              label: 'Hit detection renderer',
              scriptProps: {
                args: [
                  [
                    'coordinates',
                    [
                      '[number,number] | [number,number][] | [number,number][][]',
                    ],
                  ],
                ],
                language: 'TypeScript',
                returnType: ['void'],
              },
            }),
          },
        },
        {
          label: 'Stroke',
          value: {
            prop: 'stroke',
            schema: strokeStyleSchema(true),
          },
        },
        {
          label: 'Text',
          value: {
            prop: 'text',
            schema: textStyleSchema(true),
          },
        },
        {
          label: 'Z index',
          value: {
            prop: 'zIndex',
            schema: schemaProps.number({ label: 'Z index' }),
          },
        },
      ],
    }),
  },
};
