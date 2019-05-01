import { ConfigurationSchema } from '../editionConfig';

export const config: ConfigurationSchema<IFileConfig> = {
  '@class': {
    value: 'File',
    view: {
      type: 'hidden',
    },
  },
  mimeType: {
    type: 'string',
    view: {
      readOnly: true,
      type: 'string',
      label: 'MimeType',
    },
  },
  name: {
    type: ['string'],
    view: {
      readOnly: true,
      type: 'string',
      label: 'Name',
    },
  },
  path: {
    type: ['string'],
    view: {
      readOnly: true,
      type: 'string',
      label: 'Path',
    },
  },
  note: {
    type: ['string', 'null'],
    view: {
      type: 'string',
      label: 'Note',
    },
  },
  description: {
    type: ['string', 'null'],
    view: {
      type: 'string',
      label: 'Description',
    },
  },
  visibility: {
    type: ['string'],
    value: 'PRIVATE',
    view: {
      type: 'select',
      label: 'Visibility is',
      choices: [
        {
          value: 'INTERNAL',
          label: 'INTERNAL',
        },
        {
          value: 'PROTECTED',
          label: 'PROTECTED',
        },
        {
          value: 'INHERITED',
          label: 'INHERITED',
        },
        {
          value: 'PRIVATE',
          label: 'PRIVATE',
        },
      ],
    },
  },
  refId: {
    type: 'string',
    view: {
      readOnly: true,
      type: 'string',
      label: 'Path',
    },
  },
  bytes: {
    type: 'number',
    view: {
      readOnly: true,
      label: 'Size',
    },
  },
};
