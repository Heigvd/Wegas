import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import QuestionList from '../../AutoImport/Question/List';
import { WegasComponentProps } from '../tools/EditableComponent';

interface QuestionListDisplayProps extends WegasComponentProps {
  questionList?: string;
}

function QuestionListDisplay({ questionList }: QuestionListDisplayProps) {
  return questionList === undefined ? (
    <pre>No selected list</pre>
  ) : (
    <QuestionList variable={questionList} />
  );
}

registerComponent(
  pageComponentFactory(
    QuestionListDisplay,
    'QuestionList',
    'bars',
    {
      questionList: schemaProps.scriptVariable('Question list', true, [
        'ListDescriptor',
      ]),
    },
    ['string'],
    () => ({}),
  ),
);
