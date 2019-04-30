import { ConfigurationSchema } from '../editionConfig';

export const config: ConfigurationSchema<IFSMDescriptor.Transition> = {
  '@class': {
    value: 'Transition',
    view: { type: 'hidden' },
  },
  version: {
    type: 'number',
    value: 0,
    view: {
      type: 'uneditable',
      className: 'wegas-advanced-feature',
      label: 'Version',
    },
    index: -1,
  },
  id: {
    type: ['number', 'null'],
    view: {
      type: 'uneditable',
      label: 'Id',
    },
  },
  parentType: {
    type: 'string',
    view: { type: 'hidden' },
  },
  parentId: { type: 'number',
    view: { type: 'hidden' },
  },
  nextStateId: {
    view: { type: 'hidden' },
  },
  triggerCondition: {
    type: ['object', 'null'],
    view: {
      type: 'script',
      label: 'Condition',
      mode: 'GET',
    },
  },
  preStateImpact: {
    type: ['object', 'null'],
    view: {
      type: 'script',
      label: 'Impact',
    },
  },
  stateMachineId: { view: { type: 'hidden' } },
  index: {
    type: 'number',
    view: {
      label: 'Index',
    },
  },
};
