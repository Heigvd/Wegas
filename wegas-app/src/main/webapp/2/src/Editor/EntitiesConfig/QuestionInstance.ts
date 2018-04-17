import { ConfigurationSchema } from '../editionConfig';
import { config as variableInstanceConfig } from './VariableInstance';
export const config: ConfigurationSchema<IQuestionInstance> = {
  ...variableInstanceConfig,
  active: {
    type: 'boolean',
    view: { label: 'Active' },
  },
  validated: {
    type: 'boolean',
    view: { type: 'hidden' },
  },
  unread: {
    type: 'boolean',
    view: { type: 'hidden' },
  },
};
