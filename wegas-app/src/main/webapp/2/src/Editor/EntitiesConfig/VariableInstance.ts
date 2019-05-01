import { ConfigurationSchema } from '../editionConfig';

export const config: ConfigurationSchema<IVariableInstance> = {
  '@class': {
    index: -15,
    type: 'string',
    required: true,
    view: { type: 'hidden' },
  },
  id: {
    index: -14,
    type: 'number',
    view: {
      label: 'Instance Id',
      type: 'uneditable',
    },
  },
  version: {
    index: -13,
    type: 'number',
    view: {
      type: 'uneditable',
      label: 'Instance Version',
    },
  },
  parentType: {
    type: 'string',
    view: { type: 'hidden' },
  },
  parentId: { type: 'number',
    view: { type: 'hidden' },
  },
  scopeKey: {
    type: ['number', 'null'],
    view: { type: 'hidden' },
  },
};
