import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from './tools/componentFactory';
import { schemaProps } from './tools/schemaProps';
import { PageComponentMandatoryProps } from './tools/EditableComponent';
import { useComponentScript } from '../Hooks/useComponentScript';
import { entityIs } from '../../data/entities';

interface ExampleProps extends PageComponentMandatoryProps {
  script?: ISScript;
}

const Example: React.FunctionComponent<ExampleProps> = (
  props: ExampleProps,
) => {
  const {
    ComponentContainer,
    showBorders,
    childProps,
    containerProps,
  } = extractProps(props);
  const { content, instance, notFound } = useComponentScript<
    INumberDescriptor | ITextDescriptor
  >(childProps.script);

  return (
    <ComponentContainer {...containerProps} showBorders={showBorders}>
      {notFound ? (
        <pre>Not found: {content}</pre>
      ) : (
        <div>
          {entityIs(instance, 'StringInstance')
            ? TranslatableContent.toString(instance.trValue)
            : entityIs(instance, 'NumberInstance')
            ? String(instance.value)
            : 'The found variable is neither a StringInstance nore a NumberInstance'}
        </div>
      )}
    </ComponentContainer>
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
