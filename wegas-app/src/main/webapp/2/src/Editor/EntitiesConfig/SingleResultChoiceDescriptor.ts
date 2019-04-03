import { ConfigurationSchema } from '../editionConfig';
import { config as choiceDescriptorConfig } from './ChoiceDescriptor';
import { config as resultConfig } from './Result';
export const config: ConfigurationSchema<ISingleResultChoiceDescriptor> = {
  ...choiceDescriptorConfig,
  results: {
    type: 'array',
    value: [
      {
        '@class': 'Result',
      },
    ],
    required: true,
    items: [{ type: 'object', properties: resultConfig }],
    minItems: 1,
    maxItems: 1,
  },
};
export const label = 'Single result';
export const icon = 'check-square';

export { actions } from './VariableDescriptor';
