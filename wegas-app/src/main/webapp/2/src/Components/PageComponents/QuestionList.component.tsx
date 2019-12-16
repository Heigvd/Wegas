import * as React from 'react';
import { pageComponentFactory, registerComponent } from './componentFactory';
import { schemaProps } from './schemaProps';
import { FunctionComponent } from 'react';
import QuestionList from '../AutoImport/Question/List';

const QuestionListDisplay: FunctionComponent<{
  questionList?: string;
}> = ({ questionList }) => {
  if (questionList === undefined) {
    return <pre>No selected list</pre>;
  }
  return <QuestionList variable={questionList} />;
};

registerComponent(
  pageComponentFactory(
    QuestionListDisplay,
    'QuestionList',
    'bars',
    {
      questionList: schemaProps.variable('Question list', true, [
        'ListDescriptor',
      ]),
    },
    ['string'],
    () => ({}),
  ),
);
