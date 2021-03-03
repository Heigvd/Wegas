import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript, SListDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import QuestionList from '../../Outputs/Question/QuestionList';
import { entityIs } from '../../../data/entities';
import { useScript } from '../../Hooks/useScript';

interface QuestionListDisplayProps extends WegasComponentProps {
  questionList?: IScript;
  autoOpenFirst: boolean;
}

export default function QuestionListDisplay({
  questionList,
  autoOpenFirst,
  context,
  options,
}: QuestionListDisplayProps) {
  const descriptor = useScript<SListDescriptor>(questionList, context);

  if (questionList === undefined) {
    return <pre>No selected list</pre>;
  } else if (descriptor == null || !entityIs(descriptor, 'ListDescriptor')) {
    return <pre>Descriptor not returned as SListDescriptor</pre>;
  }

  return (
    <QuestionList
      questionList={descriptor}
      autoOpenFirst={autoOpenFirst}
      disabled={options.disabled || options.locked}
      readOnly={options.readOnly}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: QuestionListDisplay,
    componentType: 'Advanced',
    name: 'QuestionList',
    icon: 'bars',
    schema: {
      questionList: schemaProps.scriptVariable({
        label: 'Question list',
        required: true,
        returnType: [
          'SListDescriptor',
          'SQuestionDescriptor',
          'SListDescriptor[]',
          'SQuestionDescriptor[]',
        ],
      }),
      autoOpenFirst: schemaProps.boolean({
        label: 'Automatically open first item',
        value: true,
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
