import { ConfigurationSchema, MethodConfig, SELFARG } from '../editionConfig';
import { config as VariableDescriptorConfig } from './VariableDescriptor';
import { config as StringInstanceConfig } from './StringInstance';

export const config: ConfigurationSchema<IStringDescriptor> = {
  ...VariableDescriptorConfig,
  '@class': {
    value: 'StringDescriptor',
    view: { type: 'hidden' },
  },
  defaultInstance: {
    type: 'object',
    properties: StringInstanceConfig,
  },
  allowedValues: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          view: {
            type: 'hidden',
          },
        },
        '@class': {
          value: 'EnumItem',
          view: { type: 'hidden' },
        },
        label: {
          type: 'object',
          view: {
            type: 'i18nstring',
            label: 'Label',
          },
        },
        name: {
          type: 'string',
          view: {
            label: 'Name',
          },
        },
      },
    },
    view: {
      label: 'Allowed values',
    },
  },
  validationPattern: {
    type: ['string', 'null'],
    view: { type: 'hidden' },
  },
};

export const methods: MethodConfig = {
  setValue: {
    label: 'set',
    arguments: [
      SELFARG,
      {
        type: 'object',
        view: {
          type: 'i18nstring',
        },
      },
    ],
  },
  getValue: {
    label: 'get',
    returns: 'string',
    arguments: [SELFARG],
  },
};
export const label = 'String';
export const icon = 'font';
export { actions } from './VariableDescriptor';
