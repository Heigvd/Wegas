import { ConfigurationSchema } from '../editionConfig';
import { config as variableInstanceConfig } from './VariableInstance';

export const config: ConfigurationSchema<IChoiceInstance> = {
  ...variableInstanceConfig,
  active: {
    type: 'boolean',
  },
  unread: {
    type: 'boolean',
  },
  currentResultName: {
    type: ['null', 'string'],
  },
  replies: {
    view: { type: 'hidden' },
  },
};
