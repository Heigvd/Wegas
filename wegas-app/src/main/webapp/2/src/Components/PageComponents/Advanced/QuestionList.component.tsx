import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import QuestionList from '../../AutoImport/Question/List';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';

interface QuestionListDisplayProps extends PageComponentMandatoryProps {
  questionList?: string;
}

function QuestionListDisplay(props: QuestionListDisplayProps) {
  const { ComponentContainer, childProps, flexProps } = extractProps(props);
  return (
    <ComponentContainer flexProps={flexProps}>
      {childProps.questionList === undefined ? (
        <pre>No selected list</pre>
      ) : (
        <QuestionList variable={childProps.questionList} />
      )}
    </ComponentContainer>
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
