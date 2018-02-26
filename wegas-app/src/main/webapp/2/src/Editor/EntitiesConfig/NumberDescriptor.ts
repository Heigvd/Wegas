import { ConfigurationSchema } from '../editionConfig';
import { config as VariableDescriptorConfig } from './VariableDescriptor';
import { config as NumberInstanceConfig } from './NumberInstance';

export const config: ConfigurationSchema<INumberDescriptor> = {
  ...VariableDescriptorConfig,
  '@class': {
    type: 'string',
    value: 'NumberDescriptor',
    view: {
      type: 'hidden',
    },
  },
  maxValue: {
    type: ['number', 'null'],
    errored: function(val, formVal) {
      const errors = [];
      const max = typeof val === 'number' ? val : Infinity;
      const min =
        typeof formVal.minValue === 'number' ? formVal.minValue : -Infinity;
      if (max < formVal.defaultInstance.value) {
        errors.push('Maximum is less than default value');
      }
      if (max < min) {
        errors.push('Maximum is less than minimum');
      }
      return errors.join(', ');
    },
    view: { label: 'Maximum' },
  },
  minValue: {
    type: ['number', 'null'],
    errored: function(val, formVal) {
      const errors = [];
      const max =
        typeof formVal.maxValue === 'number' ? formVal.maxValue : Infinity;
      const min = typeof val === 'number' ? val : -Infinity;
      if (min > formVal.defaultInstance.value) {
        errors.push('Minimum is greater than default value');
      }
      if (min > max) {
        errors.push('Minimum is greater than maximum');
      }
      return errors.join(', ');
    },
    view: { label: 'Minimum' },
  },
  historySize: {
    type: 'number',
    view: { type: 'hidden' },
  },
  defaultInstance: {
    type: 'object',
    properties: NumberInstanceConfig,
  },
};
