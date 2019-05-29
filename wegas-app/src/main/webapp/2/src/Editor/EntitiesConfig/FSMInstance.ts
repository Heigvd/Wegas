import { config as VariableInstanceConfig } from './VariableInstance';
import { ConfigurationSchema } from '../editionConfig';

export const config: ConfigurationSchema<IFSMInstance> = {
  ...VariableInstanceConfig,
  '@class': {
    value: 'FSMInstance',
    view: { type: 'hidden' },
  },
  enabled: {
    type: 'boolean',
    value: true,
    view: { label: 'Enable' },
  },
  transitionHistory: {
    type: 'array',
    view: { type: 'hidden' },
  },
  currentStateId: {
    type: 'number',
    value: 1,
    view: {
      label: 'Current state id',
      type: 'uneditable',
    },
  },
  currentState: {
    type: 'object',
    view: { type: 'hidden' },
  },
};
