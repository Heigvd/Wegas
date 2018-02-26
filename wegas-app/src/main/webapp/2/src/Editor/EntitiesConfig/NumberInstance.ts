import { ConfigurationSchema } from '../editionConfig';
import { config as variableInstanceConfig } from './VariableInstance';

export const config: ConfigurationSchema<INumberInstance> = {
  ...variableInstanceConfig,
  '@class': {
    type: 'string',
    value: 'NumberInstance',
    view: {
      type: 'hidden',
    },
  },
  value: {
    type: 'number',
    required: true,
    view: { label: 'Value' },
  },
  history: {
    type: 'array',
    items: {
      type: 'number',
    },
    view: {
      label: 'History',
    },
  },
};
