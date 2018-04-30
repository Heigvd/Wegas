import { config as VariableInstanceConfig } from './VariableInstance';
import { ConfigurationSchema } from '../editionConfig';

export const config: ConfigurationSchema<ITextInstance> = {
  ...VariableInstanceConfig,
  '@class': {
    value: 'TextInstance',
    view: {
      type: 'hidden',
    },
  },
  value: {
    type: 'string',
    view: {
      type: 'html',
      label: 'Value',
    },
  },
};
