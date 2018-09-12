import { ConfigurationSchema, MethodConfig, SELFARG } from '../editionConfig';
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
    errored: function(
      val: number | null | undefined,
      formVal: {
        minValue: number | null | undefined;
        maxValue: number | null | undefined;
        defaultInstance: { value: number };
      },
    ) {
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
    errored: function(
      val: number | null | undefined,
      formVal: {
        minValue: number | null | undefined;
        maxValue: number | null | undefined;
        defaultInstance: { value: number };
      },
    ) {
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
  // Hide that redundant field
  defaultValue: { view: { type: 'hidden' } },
};
export const methods: MethodConfig = {
  add: {
    label: 'add',
    arguments: [
      SELFARG,
      {
        type: 'number',
        view: {
          layout: 'shortInline',
        },
      },
    ],
  },
  setValue: {
    label: 'set',
    arguments: [
      SELFARG,
      {
        type: 'number',
        view: {
          layout: 'shortInline',
        },
      },
    ],
  },
  getValue: {
    label: 'value',
    returns: 'number',
    arguments: [SELFARG],
  },
};
export const label = 'Number';
export const icon = 'chart-line';
export { actions } from './VariableDescriptor';