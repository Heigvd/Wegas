import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { extentSchema, pointSchema } from './HelperSchemas';

export const viewOptionsSchema = schemaProps.hashlist({
  label: 'View options',
  choices: [
    {
      label: 'Center',
      value: {
        prop: 'center',
        schema: schemaProps.scriptable({
          label: 'Center',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['PointLikeObject'],
          },
          literalSchema: pointSchema('Center'),
        }),
      },
    },
    {
      label: 'Projection',
      value: {
        prop: 'projection',
        schema: schemaProps.scriptable({
          label: 'Projection',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['string'],
          },
          literalSchema: schemaProps.string({}),
        }),
      },
    },
    {
      label: 'Multiworld',
      value: {
        prop: 'multiWorld',
        schema: schemaProps.scriptable({
          label: 'Multiworld',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['boolean'],
          },
          literalSchema: schemaProps.boolean({}),
        }),
      },
    },
    {
      label: 'Padding',
      value: {
        prop: 'padding',
        schema: schemaProps.scriptable({
          label: 'Padding',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['ExtentLikeObject'],
          },
          literalSchema: extentSchema(),
        }),
      },
    },
    // Extent options
    {
      label: 'Extent',
      value: {
        prop: 'extent',
        schema: schemaProps.scriptable({
          label: 'Extent',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['ExtentLikeObject'],
          },
          literalSchema: extentSchema(),
        }),
      },
    },
    {
      label: 'Constraint only center',
      value: {
        prop: 'constrainOnlyCenter',
        schema: schemaProps.scriptable({
          label: 'Constraint  only center',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['boolean'],
          },
          literalSchema: schemaProps.boolean({}),
        }),
      },
    },
    {
      label: 'Smooth extent constraint',
      value: {
        prop: 'smoothExtentConstraint',
        schema: schemaProps.scriptable({
          label: 'Smooth extent constraint',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['boolean'],
          },
          literalSchema: schemaProps.boolean({ value: true }),
        }),
      },
    },
    {
      label: 'Show full extent',
      value: {
        prop: 'showFullExtent',
        schema: schemaProps.scriptable({
          label: 'Show full extent',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['boolean'],
          },
          literalSchema: schemaProps.boolean({}),
        }),
      },
    },
    // Resolution options
    {
      label: 'Resolution',
      value: {
        prop: 'resolution',
        schema: schemaProps.scriptable({
          label: 'Resolution',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
    {
      label: 'Resolutions',
      value: {
        prop: 'resolutions',
        schema: schemaProps.scriptable({
          label: 'Resolutions',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number[] | undefined'],
          },
          literalSchema: {
            type: 'array',
            items: schemaProps.number({}),
          },
        }),
      },
    },
    {
      label: 'Max resolution',
      value: {
        prop: 'maxResolution',
        schema: schemaProps.scriptable({
          label: 'Max resolution',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
    {
      label: 'Min resolution',
      value: {
        prop: 'minResolution',
        schema: schemaProps.scriptable({
          label: 'Min resolution',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
    {
      label: 'Constrain resolution',
      value: {
        prop: 'constrainResolution',
        schema: schemaProps.scriptable({
          label: 'Constrain resolution',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['boolean'],
          },
          literalSchema: schemaProps.boolean({}),
        }),
      },
    },
    {
      label: 'Smooth resolution constraint',
      value: {
        prop: 'smoothResolutionConstraint',
        schema: schemaProps.scriptable({
          label: 'Smooth resolution constraint',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['boolean'],
          },
          literalSchema: schemaProps.boolean({ value: true }),
        }),
      },
    },
    // Zoom options
    {
      label: 'Zoom',
      value: {
        prop: 'zoom',
        schema: schemaProps.scriptable({
          label: 'Zoom',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
    {
      label: 'Max zoom',
      value: {
        prop: 'maxZoom',
        schema: schemaProps.scriptable({
          label: 'Max zoom',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
    {
      label: 'Min zoom',
      value: {
        prop: 'minZoom',
        schema: schemaProps.scriptable({
          label: 'Min zoom',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
    {
      label: 'Zoom factor',
      value: {
        prop: 'zoomFactor',
        schema: schemaProps.scriptable({
          label: 'Zoom factor',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({ value: 2 }),
        }),
      },
    },
    /// Rotation option
    {
      label: 'Rotation',
      value: {
        prop: 'rotation',
        schema: schemaProps.scriptable({
          label: 'Rotation',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({ value: 0 }),
        }),
      },
    },
    {
      label: 'Enable rotation',
      value: {
        prop: 'enableRotation',
        schema: schemaProps.scriptable({
          label: 'Enable rotation',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['boolean'],
          },
          literalSchema: schemaProps.boolean({ value: true }),
        }),
      },
    },
    {
      label: 'Constrain rotation',
      value: {
        prop: 'constrainRotation',
        schema: schemaProps.scriptable({
          label: 'Constrain rotation',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number | boolean'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
  ],
});

export const mapOptionsSchema = schemaProps.hashlist({
  label: 'Map options',
  choices: [
    {
      label: 'Controls',
      value: {
        prop: 'controls',
        schema: schemaProps.scriptable({
          label: 'Controls',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['MapControls[]'],
          },
          literalSchema: {
            type: 'array',
            items: schemaProps.select({
              values: [
                'attribution',
                'fullscreen',
                'mousePosition',
                'overviewMap',
                'rotate',
                'scaleLine',
                'zoomSlider',
                'zoomToExtent',
                'zoom',
              ],
            }),
          },
        }),
      },
    },
    {
      label: 'Pixel ratio',
      value: {
        prop: 'pixelRatio',
        schema: schemaProps.scriptable({
          label: 'Pixel ratio',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({}),
        }),
      },
    },
    {
      label: 'Max tiles loading',
      value: {
        prop: 'maxTilesLoading',
        schema: schemaProps.scriptable({
          label: 'Max tiles loading',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({ value: 16 }),
        }),
      },
    },
    {
      label: 'Move tolerance (moved pixels before triggering event)',
      value: {
        prop: 'moveTolerance',
        schema: schemaProps.scriptable({
          label: 'Move tolerance (moved pixels before triggering event)',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['number'],
          },
          literalSchema: schemaProps.number({ value: 1 }),
        }),
      },
    },
  ],
});
