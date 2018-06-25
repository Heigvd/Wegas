import { ConfigurationSchema } from '../editionConfig';
import { config as VariableDescriptorConfig } from './VariableDescriptor';
import { rootDescriptors } from '../../data/entities';
const AVAILABLE_TYPES = rootDescriptors.map(v => ({
  value: v,
  label: v.slice(0, -10),
}));
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
    view: { type: 'hidden' },
  },
  allowedTypes: {
    type: 'array',
    view: {
      label: 'Allowed Types',
    },
    items: {
      type: 'string',
      required: true,
      view: {
        type: 'select',
        label: 'Type',
        choices: AVAILABLE_TYPES,
      },
    },
  },
  addShortcut: {
    type: 'string',
    value: '',
    view: {
      type: 'select',
      label: 'Default child type',
      choices: [{ label: 'none', value: '' }].concat(AVAILABLE_TYPES),
    },
  },
};

export const children = [
  'NumberDescriptor',
  'ListDescriptor',
  'FSMDescriptor',
  'TextDescriptor',
  'StringDescriptor',
  'QuestionDescriptor',
];
