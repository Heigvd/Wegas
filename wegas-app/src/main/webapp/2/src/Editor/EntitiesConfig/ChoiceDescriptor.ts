import { ConfigurationSchema } from '../editionConfig';
import { config as variableDescriptorConfig } from './VariableDescriptor';
import { config as choiceInstanceConfig } from './ChoiceInstance';
import { VariableDescriptor } from '../../data/selectors';
import { entityIs } from '../../data/entities';

export const config: ConfigurationSchema<IChoiceDescriptor> = {
  ...variableDescriptorConfig,
  description: {
    type: ['null', 'object'],
    view: {
      type: 'i18nhtml',
      label: 'Description',
    },
  },
  defaultInstance: {
    type: 'object',
    properties: choiceInstanceConfig,
  },
  maxReplies: {
    type: ['null', 'number'],
    minimum: 1,
    visible: function(_val: any, formVal: { id?: number }) {
      if (formVal.id) {
        const parent = VariableDescriptor.select(
          VariableDescriptor.select(formVal.id)!.parentId,
        );
        if (entityIs<IQuestionDescriptor>(parent, 'QuestionDescriptor')) {
          // not applicable for checkboxed questions and useless if q.maxReplies equals 1
          return !parent.cbx && parent.maxReplies !== 1;
        }
      }
      return true;
    },
    view: {
      label: 'Max. number replies',
      placeholder: '∞',
      layout: 'shortInline',
    },
  },
  cost: {
    type: 'number',
    view: {
      label: 'Cost',
    },
  },
  duration: {
    type: 'number',
    view: {
      label: 'Duration',
    },
  },
  results: {
    view: { type: 'hidden' },
  },
};
export const children = ['Result'];
export const label = 'Conditional result';
export const icon = 'check-square';
export { actions } from './VariableDescriptor';
