import { ConfigurationSchema } from '../editionConfig';

export const config: ConfigurationSchema<IFSMDescriptor.State> = {
  '@class': {
    value: 'State',
    view: {
      type: 'hidden',
    },
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
  parentId: {
    type: 'number',
    view: { type: 'hidden' },
  },

  label: {
    type: 'string',
    view: {
      label: 'Label',
    },
  },
  editorPosition: {
    view: {
      type: 'hidden',
    },
  },
  onEnterEvent: {
    type: ['object', 'null'],
    view: {
      type: 'script',
      label: 'On enter impact',
    },
  },
  transitions: {
    view: {
      type: 'hidden',
    },
  },
};
