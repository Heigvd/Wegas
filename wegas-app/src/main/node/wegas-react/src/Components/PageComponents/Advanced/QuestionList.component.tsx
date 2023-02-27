import * as React from 'react';
import { IScript, SListDescriptor } from 'wegas-ts-api';
import { entityIs } from '../../../data/entities';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import QuestionList from '../../Outputs/Question/QuestionList';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface QuestionListDisplayProps extends WegasComponentProps {
  questionList?: IScript;
  autoOpenFirst: boolean;
  edit?: IScript;
  mobileDisplay?: boolean;
}

export default function QuestionListDisplay({
  questionList,
  autoOpenFirst,
  mobileDisplay,
  edit,
  context,
  options,
}: QuestionListDisplayProps) {
  const descriptor = useScript<SListDescriptor>(questionList, context);
  const editing = useScript<boolean>(edit, context);

  if (questionList === undefined) {
    return <pre>No selected list</pre>;
  } else if (descriptor == null || !entityIs(descriptor, 'ListDescriptor')) {
    return <pre>Descriptor not returned as SListDescriptor</pre>;
  }

  return (
    <QuestionList
      questionList={descriptor}
      autoOpenFirst={autoOpenFirst}
      mobileDisplay={mobileDisplay}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
      editMode={editing}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: QuestionListDisplay,
    componentType: 'Advanced',
    id: 'QuestionList',
    name: 'Question list',
    icon: 'bars',
    illustration: 'questionList',
    schema: {
      questionList: schemaProps.scriptVariable({
        label: 'Question list',
        required: true,
        returnType: [
          'SListDescriptor',
          'SQuestionDescriptor',
          'SWhQuestionDescriptor',
          '(SListDescriptor | SQuestionDescriptor | SWhQuestionDescriptor)[]',
        ],
      }),
      autoOpenFirst: schemaProps.boolean({
        label: 'Automatically open first item',
        value: true,
      }),
      mobileDisplay: schemaProps.boolean({
        label: 'Allow display to switch to mobile when needed',
        value: false,
      }),
      edit: schemaProps.scriptVariable({
        label: 'Edition mode',
        required: false,
        returnType: ['boolean'],
      }),
    },
    allowedVariables: ['ListDescriptor', 'QuestionDescriptor'],
    getComputedPropsFromVariable: v => ({
      questionList: createFindVariableScript(v),
      style: {
        overflow: 'auto',
      },
    }),
  }),
);
