import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { ConnectedQuestionDisplay } from '../../AutoImport/Question/List';
import { entityIs } from '../../../data/entities';
import { useScript } from '../../Hooks/useScript';

interface QuestionDisplayProps extends PageComponentMandatoryProps {
  /**
   * script - a script returning a QuestionDescriptor
   */
  script?: IScript;
}

function QuestionDisplay({ script, EditHandle }: QuestionDisplayProps) {
  const descriptor = useScript(
    script ? script.content : '',
  ) as IQuestionDescriptor;
  return (
    <>
      <EditHandle />
      {descriptor === undefined ||
      !entityIs(descriptor, 'QuestionDescriptor') ? (
        <pre>Undefined entity</pre>
      ) : (
        <ConnectedQuestionDisplay entity={descriptor} />
      )}
    </>
  );
}

registerComponent(
  pageComponentFactory(
    QuestionDisplay,
    'Question',
    'question',
    {
      question: schemaProps.scriptVariable(
        'Question',
        true,
        ['QuestionDescriptor'],
        true,
      ),
    },
    ['string'],
    () => ({}),
  ),
);
