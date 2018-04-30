import { ConfigurationSchema } from '../editionConfig';
import { config as VariableDescriptorConfig } from './VariableDescriptor';
import { config as TextInstanceConfig } from './TextInstance';

export const config: ConfigurationSchema<ITextDescriptor> = {
  ...VariableDescriptorConfig,
  defaultInstance: {
    type: 'object',
    properties: TextInstanceConfig,
  },
};
