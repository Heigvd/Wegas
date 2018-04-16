import { ConfigurationSchema } from '../editionConfig';
import { config as variableInstanceConfig } from './VariableInstance';

export const config: ConfigurationSchema<IChoiceInstance> = {
  ...variableInstanceConfig,
  active: {
    type: 'boolean',
    view: {
      label: 'Active',
    },
  },
  unread: {
    type: 'boolean',
    view: { label: 'Unread' },
  },
  currentResultName: {
    type: ['null', 'string'],
    view: { label: 'Result' },
  },
  replies: {
    view: { type: 'hidden' },
  },
};
