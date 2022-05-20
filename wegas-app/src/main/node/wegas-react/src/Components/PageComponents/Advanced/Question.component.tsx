import * as React from 'react';
import { IScript, SQuestionDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { wwarn } from '../../../Helper/wegaslog';
import { useScript } from '../../Hooks/useScript';
import { ConnectedQuestionDisplay } from '../../Outputs/Question/Question';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface QuestionDisplayProps extends WegasComponentProps {
  /**
   * script - a script returning a QuestionDescriptor
   */
  question?: IScript;
}

export default function QuestionDisplay({
  question,
  context,
  options,
  pageId,
  path,
}: QuestionDisplayProps) {
  const descriptor = useScript<SQuestionDescriptor>(question, context);

  if (descriptor == null) {
    wwarn(`${question?.content} Not found`);
    return <UncompleteCompMessage pageId={pageId} path={path} />;
  } else {
    return (
      <ConnectedQuestionDisplay
        entity={descriptor!.getEntity()}
        disabled={options.disabled || options.locked}
        readOnly={options.readOnly}
      />
    );
  }
}

registerComponent(
  pageComponentFactory({
    component: QuestionDisplay,
    componentType: 'Advanced',
    id: 'Question',
    name: 'Question',
    icon: 'question',
    illustration: 'question',
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
