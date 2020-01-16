import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { useVariableInstance } from '../Hooks/useVariable';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from './tools/componentFactory';
import { schemaProps } from './tools/schemaProps';
import { useScript } from '../Hooks/useScript';

interface ExampleProps extends PageComponentMandatoryProps {
  script?: ISScript;
}

const Example: React.FunctionComponent<ExampleProps> = ({
  script,
  EditHandle,
}: ExampleProps) => {
  const descriptor = useScript(script ? script.content : '') as
    | IStringDescriptor
    | ISNumberDescriptor;
  const instance = useVariableInstance(descriptor);

  return (
    <>
      <EditHandle />
      {instance === undefined ? (
        <span>{`Instance of ${descriptor.name} not found`}</span>
      ) : (
        <div>
          {'trValue' in instance
            ? TranslatableContent.toString(instance.trValue)
            : String(instance.value)}
        </div>
      )}
    </>
  );
};

registerComponent(
  pageComponentFactory(
    Example,
    'Example',
    'ambulance',
    {
      script: schemaProps.scriptVariable('Variable', true, [
        'TextDescriptor',
        'NumberDescriptor',
      ]),
    },
    ['ISNumberDescriptor', 'ISStringDescriptor'],
    () => ({}),
  ),
);
