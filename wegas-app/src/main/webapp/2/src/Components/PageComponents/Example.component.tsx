import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { useVariableInstance } from '../Hooks/useVariable';
import { pageComponentFactory, registerComponent } from './componentFactory';

interface ExampleProps {
  variable: IStringDescriptor | ISNumberDescriptor;
}

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
      variable: {
        enum: ['INTERNAL', 'PROTECTED', 'INHERITED', 'PRIVATE'],
        required: false,
        type: 'string',
        view: {
          choices: [
            {
              label: 'Model',
              value: 'INTERNAL',
            },
            {
              label: 'Protected',
              value: 'PROTECTED',
            },
            {
              label: 'Inherited',
              value: 'INHERITED',
            },
            {
              label: 'Private',
              value: 'PRIVATE',
            },
          ],
          featureLevel: 'DEFAULT',
          index: 0,
          label: 'Variable',
          type: 'select',
        },
      },
    },
  },
  ['ISNumberDescriptor', 'ISStringDescriptor'],
  variable => ({
    variable: variable,
    label: 'salut',
    hello: 'sadjkajw',
  }),
);

registerComponent('SimpleComponent', SimpleComponent);

export default SimpleComponent;
