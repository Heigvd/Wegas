import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { ConnectedQuestionDisplay } from '../../Outputs/Question/Question';
import { IScript, SQuestionDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useScript } from '../../Hooks/useScript';
import { TumbleLoader } from '../../Loader';
import { checkExistsWarnNotFound } from '../tools/methods';

interface QuestionDisplayProps extends WegasComponentProps {
  /**
   * script - a script returning a QuestionDescriptor
   */
  question?: IScript;
}

export default function QuestionDisplay({
  question,
  context,
}: QuestionDisplayProps) {
  const descriptor = useScript<SQuestionDescriptor>(question, context);

  return checkExistsWarnNotFound(descriptor, question?.content) ? (
    <ConnectedQuestionDisplay entity={descriptor!.getEntity()} />
  ) : (
    <TumbleLoader />
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
