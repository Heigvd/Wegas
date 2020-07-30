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

interface QuestionDisplayProps extends WegasComponentProps {
  /**
   * script - a script returning a QuestionDescriptor
   */
  question?: IScript;
}

function QuestionDisplay({ question }: QuestionDisplayProps) {
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
  pageComponentFactory(
    QuestionDisplay,
    'Advanced',
    'Question',
    'question',
    {
      question: schemaProps.scriptVariable('Question', true, [
        'SQuestionDescriptor',
      ]),
    },
    ['string'],
    () => ({}),
  ),
);
