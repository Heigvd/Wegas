import { ConfigurationSchema, MethodConfig, SELFARG } from '../editionConfig';
import { config as VariableDescriptorConfig } from './VariableDescriptor';
import { config as TextInstanceConfig } from './TextInstance';

export const config: ConfigurationSchema<ITextDescriptor> = {
  ...VariableDescriptorConfig,
  '@class': {
    value: 'TextDescriptor',
    view: { type: 'hidden' },
  },
  defaultInstance: {
    type: 'object',
    properties: TextInstanceConfig,
  },
};

export const methods: MethodConfig = {
  setValue: {
    label: 'set',
    arguments: [
      SELFARG,
      {
        type: 'object',
        view: {
          type: 'i18nhtml',
        },
      },
    ],
  },
  getValue: {
    label: 'get',
    returns: 'string',
    arguments: [SELFARG],
  },
};
export const label = 'Text';
export const icon = 'paragraph';

export { actions } from './VariableDescriptor';
