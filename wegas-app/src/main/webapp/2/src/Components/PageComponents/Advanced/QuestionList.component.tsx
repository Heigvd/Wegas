import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { FunctionComponent } from 'react';
import QuestionList from '../../AutoImport/Question/List';

interface QuestionListDisplayProps extends PageComponentMandatoryProps {
  questionList?: string;
}

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
      questionList: schemaProps.variable(
        'Question list',
        true,
        ['ListDescriptor'],
        true,
      ),
    },
    ['string'],
    () => ({}),
  ),
);
