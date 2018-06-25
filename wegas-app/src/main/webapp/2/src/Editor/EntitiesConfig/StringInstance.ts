import { config as VariableInstanceConfig } from './VariableInstance';
import { ConfigurationSchema } from '../editionConfig';

export const config: ConfigurationSchema<IStringInstance> = {
  ...VariableInstanceConfig,
  '@class': {
    value: 'StringInstance',
    view: {
      type: 'hidden',
    },
  },
  trValue: {
    type: 'object',
    view: {
      type: 'i18nstring',
      label: 'Value',
    },
  },
};
