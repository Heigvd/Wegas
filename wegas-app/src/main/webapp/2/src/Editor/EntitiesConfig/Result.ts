import { ConfigurationSchema } from '../editionConfig';
import { VariableDescriptor } from '../../data/selectors';

export const config: ConfigurationSchema<IResult> = {
  '@class': {
    value: 'Result',
  },
  id: {
    type: ['number', 'null'],
    view: {
      type: 'uneditable',
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
  label: {
    type: 'object',
    index: -1,
    view: {
      type:"i18nstring",
      label: 'Name',
    },
  },
  name: {
    value: '',
    type: ['string', 'null'],
    index: -1,
    view: {
      className: 'wegas-advanced-feature',
      label: 'Script alias',
      //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
      description:
        "Changing this may break your scripts! Use alphanumeric characters,'_','$'. No digit as first character.",
    },
  },
  answer: {
    type: 'object',
    view: {
      type: 'i18nhtml',
      label: 'Feedback',
      borderTop: true,
    },
    index: 10,
  },
  impact: {
    type: ['null', 'object'],
    properties: {
      '@class': {
        type: 'string',
        value: 'Script',
        view: { type: 'hidden' },
      },
      content: {
        type: 'string',
      },
    },
    view: {
      label: 'Impact',
      type: 'script',
    },
    index: 11,
  },
  ignorationAnswer: {
    type: ['object', 'null'],
    visible: function(_val: any, formVal: {}, path: string[]) {
      path.pop(); // remove current key
      const result: IResult = path.reduce((prev: any, v) => prev[v], formVal);
      const choice = VariableDescriptor.select(result.choiceDescriptorId);
      if (choice != null) {
        const question = VariableDescriptor.select(
          choice.parentDescriptorId,
        ) as IQuestionDescriptor;
        return question.cbx;
      }
      return false;
    },
    view: {
      type: 'i18nhtml',
      label: 'Feedback when ignored',
      borderTop: true,
    },
    index: 12,
  },
  ignorationImpact: {
    type: ['null', 'object'],
    properties: {
      '@class': {
        type: 'string',
        value: 'Script',
        view: { type: 'hidden' },
      },
      content: {
        type: 'string',
      },
    },
    visible: function(__val: any, formVal: {}, path: string[]) {
      path.pop(); // remove current key
      const result: IResult = path.reduce((prev: any, v) => prev[v], formVal);
      const choice = VariableDescriptor.select(result.choiceDescriptorId);
      if (choice != null) {
        const question = VariableDescriptor.select(
          choice.parentDescriptorId,
        ) as IQuestionDescriptor;
        return question.cbx;
      }
      return false;
    },
    view: {
      label: 'Impact on variables when ignored',
      type: 'script',
    },
    index: 13,
  },
  choiceDescriptorId: {
    type: 'number',
    view: {
      type: 'hidden',
    },
  },
  files: {
    type: 'array',
    value: [],
    items: {
      type: 'string',
      optional: true,
      view: {
        type: 'wegasurl',
        label: '',
      },
    },
    view: {
      type: 'hidden',
    },
  },
};
