import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import {
  pageComponentFactory,
  registerComponent,
} from './tools/componentFactory';
import { schemaProps } from './tools/schemaProps';
import { useComponentScript } from '../Hooks/useComponentScript';
import { entityIs } from '../../data/entities';
import { WegasComponentProps } from './tools/EditableComponent';

interface ExampleProps extends WegasComponentProps {
  script?: ISScript;
}

const Example: React.FunctionComponent<ExampleProps> = ({
  script,
}: ExampleProps) => {
  const { content, instance, notFound } = useComponentScript<
    INumberDescriptor | ITextDescriptor
  >(script);

  return notFound ? (
    <pre>Not found: {content}</pre>
  ) : (
    <div>
      {entityIs(instance, 'StringInstance')
        ? TranslatableContent.toString(instance.trValue)
        : entityIs(instance, 'NumberInstance')
        ? String(instance.value)
        : 'The found variable is neither a StringInstance nore a NumberInstance'}
    </div>
  );
};

registerComponent(
  pageComponentFactory(
    Example,
    'Advanced',
    'Example',
    'ambulance',
    {
      script: schemaProps.scriptVariable('Variable', true, [
        'ISTextDescriptor',
        'ISNumberDescriptor',
      ]),
    },
    ['ISNumberDescriptor', 'ISStringDescriptor'],
    () => ({}),
  ),
);
