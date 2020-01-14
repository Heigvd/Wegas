import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { useScript } from '../../Hooks/useScript';
import { useVariableInstance } from '../../Hooks/useVariable';
import { TranslatableContent } from '../../../data/i18n';

interface TextProps extends PageComponentMandatoryProps {
  script?: IScript;
  className?: string;
}

function Text({ script, className, EditHandle }: TextProps) {
  const textD = useScript(script ? script.content : '') as ISTextDescriptor;
  const textI = useVariableInstance(textD);

  return (
    <>
      <EditHandle />
      {textD === undefined || textI === undefined ? (
        <span>Not found: {script}</span>
      ) : (
        <div className={className}>
          <div
            style={{ display: 'inline-block' }}
            dangerouslySetInnerHTML={{
              __html: TranslatableContent.toString(
                textI.trValue === undefined ? null : textI.trValue,
              ),
            }}
          />
        </div>
      )}
    </>
  );
}

registerComponent(
  pageComponentFactory(
    Text,
    'Text',
    'paragraph',
    {
      script: schemaProps.scriptVariable(
        'Variable',
        true,
        ['TextDescriptor'],
        true,
      ),
      className: schemaProps.string('ClassName', false),
    },
    ['ISTextDescriptor'],
    () => ({}),
  ),
);
