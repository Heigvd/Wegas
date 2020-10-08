import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { WegasComponentProps } from '../tools/EditableComponent';
import { ConnectedQuestionDisplay } from '../../Outputs/Question';
import { IScript, IQuestionDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';

interface QuestionDisplayProps extends WegasComponentProps {
  /**
   * script - a script returning a QuestionDescriptor
   */
  question?: IScript;
}

export default function QuestionDisplay({ question }: QuestionDisplayProps) {
  const { content, descriptor, notFound } = useComponentScript<
    IQuestionDescriptor
  >(question);

  return notFound ? (
    <pre>Not found: {content}</pre>
  ) : (
    <ConnectedQuestionDisplay entity={descriptor!.getEntity()} />
  );
}

registerComponent(
  pageComponentFactory({
    component: QuestionDisplay,
    componentType: 'Advanced',
    name: 'Question',
    icon: 'question',
    schema: {
      question: schemaProps.scriptVariable({
        label: 'Question',
        required: true,
        returnType: ['SQuestionDescriptor'],
      }),
    },
    allowedVariables: ['QuestionDescriptor'],
    getComputedPropsFromVariable: v => ({
      question: createFindVariableScript(v),
    }),
  }),
);
