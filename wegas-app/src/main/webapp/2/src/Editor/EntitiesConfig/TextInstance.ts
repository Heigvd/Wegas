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
  trValue: {
    type: 'object',
    view: {
      type: 'i18nhtml',
      label: 'Value',
    },
  },
};
