import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { pointSchema } from './HelperSchemas';

export const overlaySchema = {
  overlayProps: schemaProps.hashlist({
    label: 'Overlay options',
    choices: [
      {
        label: 'Overlay id',
        value: {
          prop: 'overlayId',
          schema: schemaProps.scriptable({
            label: 'Overlay id',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['string'],
            },
            literalSchema: schemaProps.string({}),
          }),
        },
      },
      {
        label: 'Overlay classname',
        value: {
          prop: 'overlayClassName',
          schema: schemaProps.scriptable({
            label: 'Overlay classname',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['string'],
            },
            literalSchema: schemaProps.string({}),
          }),
        },
      },
      {
        label: 'Position',
        value: {
          prop: 'position',
          schema: schemaProps.scriptable({
            label: 'Position',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['PointLikeObject'],
            },
            literalSchema: pointSchema(),
          }),
        },
      },
      {
        label: 'Offset',
        value: {
          prop: 'offset',
          schema: schemaProps.scriptable({
            label: 'Offset',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['PointLikeObject'],
            },
            literalSchema: pointSchema(),
          }),
        },
      },
      {
        label: 'Positionning',
        value: {
          prop: 'positioning',
          schema: schemaProps.scriptable({
            label: 'Positionning',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['PositionOptions'],
            },
            literalSchema: schemaProps.select({
              values: [
                'bottom-left',
                'bottom-center',
                'bottom-right',
                'center-left',
                'center-center',
                'center-right',
                'top-left',
                'top-center',
                'top-right',
              ],
              value: 'top-left',
            }),
          }),
        },
      },
      {
        label: 'Stop event',
        value: {
          prop: 'stopEvent',
          schema: schemaProps.scriptable({
            label: 'Stop event',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['boolean'],
            },
            literalSchema: schemaProps.boolean({ value: true }),
          }),
        },
      },
      {
        label: 'Insert first',
        value: {
          prop: 'insertFirst',
          schema: schemaProps.scriptable({
            label: 'Insert first',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['boolean'],
            },
            literalSchema: schemaProps.boolean({}),
          }),
        },
      },
      {
        label: 'Auto pan',
        value: {
          prop: 'autoPan',
          schema: schemaProps.scriptable({
            label: 'Auto pan',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['AutoPanOptions'],
            },
            literalSchema: schemaProps.boolean({}),
          }),
        },
      },
      {
        label: 'Position on click',
        value: {
          prop: 'positionOnClick',
          schema: schemaProps.scriptable({
            label: 'Position on click',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['boolean'],
            },
            literalSchema: schemaProps.boolean({}),
          }),
        },
      },
      {
        label: 'Features filter',
        value: {
          prop: 'featuresFilter',
          schema: schemaProps.code({
            label: 'Features filter',
            scriptProps: {
              language: 'TypeScript',
              returnType: ['FeatureFilter'],
            },
          }),
        },
      },
    ],
  }),
};
