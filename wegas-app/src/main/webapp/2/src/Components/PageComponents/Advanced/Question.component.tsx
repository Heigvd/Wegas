import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { ConnectedQuestionDisplay } from '../../AutoImport/Question/List';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { WegasComponentProps } from '../tools/EditableComponent';

interface QuestionDisplayProps extends WegasComponentProps {
  /**
   * script - a script returning a QuestionDescriptor
   */
  script?: IScript;
}

function QuestionDisplay({ script }: QuestionDisplayProps) {
  const { content, descriptor, notFound } = useComponentScript<
    IQuestionDescriptor
  >(script);

  return notFound ? (
    <pre>Not found: {content}</pre>
  ) : (
    <ConnectedQuestionDisplay entity={descriptor!} />
  );
}

registerComponent(
  pageComponentFactory(
    QuestionDisplay,
    'Question',
    'question',
    {
      question: schemaProps.scriptVariable('Question', true, [
        'QuestionDescriptor',
      ]),
    },
    ['string'],
    () => ({}),
  ),
);
