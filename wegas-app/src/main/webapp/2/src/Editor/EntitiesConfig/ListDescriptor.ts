import { ConfigurationSchema, getLabel } from '../editionConfig';
import { config as VariableDescriptorConfig } from './VariableDescriptor';

export const children = [
  'NumberDescriptor',
  'StringDescriptor',
  'ListDescriptor',
  'TextDescriptor',
  // 'BooleanDescriptor',
  // 'ObjectDescriptor',
  // 'TriggerDescriptor',
  'QuestionDescriptor',
  'FSMDescriptor',
];
const AVAILABLE_TYPES = Promise.all(
  children.map(c =>
    getLabel({ '@class': c }).then(l => {
      return {
        label: l || '',
        value: c,
      };
    }),
  ),
);
export const config: ConfigurationSchema<IListDescriptor> = {
  ...VariableDescriptorConfig,
  '@class': {
    value: 'ListDescriptor',
    view: {
      type: 'hidden',
    },
  },
  itemsIds: {
    view: {
      type: 'hidden',
    },
  },
  defaultInstance: {
    value: {
      '@class': 'ListInstance',
    },
    view: { type: 'hidden' },
  },
  allowedTypes: {
    type: 'array',
    view: {
      label: 'Allowed types',
    },
    items: {
      type: 'string',
      required: true,
      view: {
        type: 'select',
        label: 'Type',
        choices: () => AVAILABLE_TYPES,
      },
    },
  },
  addShortcut: {
    type: 'string',
    value: '',
    view: {
      type: 'select',
      label: 'Default child type',
      choices: () =>
        AVAILABLE_TYPES.then(a => [{ label: 'none', value: '' }].concat(a)),
    },
  },
};
export const label = 'Folder';
export const icon = 'folder';
export { actions } from './VariableDescriptor';
