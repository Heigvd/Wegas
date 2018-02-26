import { ConfigurationSchema } from '../editionConfig';
import { config as variableDescriptorConfig } from './VariableDescriptor';
import { config as questionInstanceConfig } from './QuestionInstance';
export const config: ConfigurationSchema<IQuestionDescriptor> = {
  ...variableDescriptorConfig,
  defaultInstance: {
    type: 'object',
    properties: questionInstanceConfig,
  },
  description: {
    type: ['null', 'string'],
    index: 5,
    view: {
      type: 'html',
      label: 'Description',
    },
  },
  itemsIds: {
    view: {
      type: 'hidden',
    },
  },
  cbx: {
    index: 1,
    type: 'boolean',
    view: {
      label: 'Checkbox answer',
      description: 'For standard multiple-choice questions',
    },
  },
  tabular: {
    index: 2,
    type: 'boolean',
    visible: function(_val, formVal) {
      return formVal.cbx;
    },
    view: {
      label: 'Tabular layout',
      description: 'Replies are presented horizontally',
    },
  },
  minReplies: {
    type: ['null', 'number'],
    index: 3,
    value: 1,
    minimum: 0,
    visible: function(_val, formVal) {
      return formVal.cbx;
    },
    errored: function(val, formVal) {
      const errors = [];
      const min = typeof val === 'number' ? val : 1;
      const max = formVal.maxReplies;
      if (min < 0) {
        errors.push('Value must be positive');
      }
      if (formVal.cbx && typeof max === 'number' && min > max) {
        errors.push(
          'Value cannot be greater than the maximum number of replies',
        );
      }
      return errors.join(', ');
    },
    view: {
      label: 'Min. number replies',
      placeholder: '1',
      layout: 'shortInline',
    },
  },
  maxReplies: {
    type: ['null', 'number'],
    index: 4,
    value: 1,
    minimum: 1,
    errored: function(val, formVal) {
      const errors = [];
      if (typeof val === 'number') {
        if (val < 1) {
          errors.push('Value must be strictly positive or empty');
        }
        if (formVal.cbx && typeof formVal.minReplies === 'number') {
          if (val < formVal.minReplies) {
            errors.push('Value must be greater than or equal to the minimum');
          }
        }
      }
      return errors.join(', ');
    },
    view: {
      label: 'Max. number replies',
      placeholder: '∞',
      layout: 'shortInline',
    },
  },
  pictures: {
    type: 'array',
    view: { type: 'hidden' },
  },
};
