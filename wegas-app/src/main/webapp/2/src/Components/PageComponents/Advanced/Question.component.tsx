import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { ConnectedQuestionDisplay } from '../../AutoImport/Question/List';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';

interface QuestionDisplayProps extends PageComponentMandatoryProps {
  /**
   * script - a script returning a QuestionDescriptor
   */
  script?: IScript;
}

function QuestionDisplay(props: QuestionDisplayProps) {
  const { ComponentContainer, childProps, flexProps } = extractProps(props);
  const { content, descriptor, notFound } = useComponentScript<
    IQuestionDescriptor
  >(childProps.script);

  return (
    <ComponentContainer flexProps={flexProps}>
      {notFound ? (
        <pre>Not found: {content}</pre>
      ) : (
        <ConnectedQuestionDisplay entity={descriptor!} />
      )}
    </ComponentContainer>
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
