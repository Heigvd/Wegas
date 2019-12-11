import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { useVariableInstance } from '../Hooks/useVariable';
import { pageComponentFactory, registerComponent } from './componentFactory';
import { schemaProps } from './schemaProps';

interface ExampleProps {
  variable?: IStringDescriptor | INumberDescriptor;
}

const Example: React.FunctionComponent<ExampleProps> = ({
  variable,
}: ExampleProps) => {
  const instance = useVariableInstance(variable);
  if (variable === undefined) {
    return <span>Variable undefined</span>;
  }
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

registerComponent(
  pageComponentFactory(
    Example,
    'Example',
    'ambulance',
    {
      variable: schemaProps.variable('Variable'),
    },
    ['ISNumberDescriptor', 'ISStringDescriptor'],
    variable => ({ variable }),
  ),
);
