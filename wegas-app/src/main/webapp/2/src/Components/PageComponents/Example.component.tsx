import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { useVariableInstance } from '../Hooks/useVariable';
import { pageComponentFactory, registerComponent } from './componentFactory';
import { proxyfy } from '../../data/proxyfy';
import { schemaProps } from './schemaProps';

interface ExampleProps {
  variable: IStringDescriptor | INumberDescriptor;
}

const defaultExampleProps: ExampleProps = {
  variable: proxyfy<INumberDescriptor>({
    '@class': 'NumberDescriptor',
    defaultValue: 42,
    comments: '',
    label: {
      '@class': 'TranslatableContent',
      version: 0,
      translations: {
        en: {
          '@class': 'Translation',
          translation: 'kjkj',
          lang: 'en',
          status: '',
        },
      },
    },
    version: 0,
    editorTag: '',
    defaultInstance: {
      '@class': 'NumberInstance',
      history: [],
      version: 0,
      value: 42,
    },
  })!,
};

const Example: React.FunctionComponent<ExampleProps> = ({
  variable,
}: ExampleProps) => {
  const instance = useVariableInstance(variable);
  if (instance === undefined) {
    return <span>{`Instance of ${variable.name} not found`}</span>;
  }
  return (
    <div>
      {'trValue' in instance
        ? TranslatableContent.toString(instance.trValue)
        : String(instance.value)}
    </div>
  );
};

const SimpleComponent = pageComponentFactory(
  Example,
  'ambulance',
  {
    description: 'Example',
    properties: {
      variable: schemaProps.variable('Variable'),
    },
  },
  ['ISNumberDescriptor', 'ISStringDescriptor'],
  variable =>
    variable
      ? {
          variable: variable,
        }
      : defaultExampleProps,
);

registerComponent('SimpleComponent', SimpleComponent);

export default SimpleComponent;
