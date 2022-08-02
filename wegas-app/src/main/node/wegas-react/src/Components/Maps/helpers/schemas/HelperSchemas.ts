import { AvailableSchemas } from '../../../FormView';
import { schemaProps } from '../../../PageComponents/tools/schemaProps';
import { EPSGCodes } from '../epsgCodes';

export const extentSchema: (
  label?: string,
  required?: boolean,
) => AvailableSchemas = (label, required) =>
  schemaProps.nupple({
    label,
    required,
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
  });

export const pointSchema: (
  label?: string,
  required?: boolean,
) => AvailableSchemas = (label, required) =>
  schemaProps.nupple({
    label,
    required,
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
  });

export const projectionSchema = (label?: string) =>
  schemaProps.select({
    label,
    values: EPSGCodes,
  });
