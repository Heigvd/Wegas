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

const QuestionListDisplay: FunctionComponent<QuestionListDisplayProps> = ({
  EditHandle,
  questionList,
}) => {
  return (
    <>
      <EditHandle />
      {questionList === undefined ? (
        <pre>No selected list</pre>
      ) : (
        <QuestionList variable={questionList} />
      )}
    </>
  );
};

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
