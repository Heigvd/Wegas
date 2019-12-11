import * as React from 'react';
import { pageComponentFactory, registerComponent } from './componentFactory';
import { schemaProps } from './schemaProps';
import { FunctionComponent } from 'react';
import { ConnectedQuestionDisplay } from '../AutoImport/Question/List';
import { entityIs } from '../../data/entities';
import { useVariableDescriptor } from '../Hooks/useVariable';

const QuestionDisplay: FunctionComponent<{
  question?: string;
}> = ({ question }) => {
  const entity = useVariableDescriptor(question);
  if (
    entity === undefined ||
    !entityIs<IQuestionDescriptor>(entity, 'QuestionDescriptor')
  ) {
    return <pre>Undefined entity</pre>;
  }
  return <ConnectedQuestionDisplay entity={entity} />;
};

registerComponent(
  pageComponentFactory(
    QuestionDisplay,
    'Question',
    'question',
    {
      question: schemaProps.variable('Question', ['QuestionDescriptor']),
    },
    ['string'],
    () => ({}),
  ),
);
