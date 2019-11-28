import * as React from 'react';
import { TranslatableContent } from '../../data/i18n';
import { useVariableInstance } from '../Hooks/useVariable';
import { pageComponentFactory, registerComponent } from './componentFactory';

interface SimpleProps {
  variable: IStringDescriptor | ISNumberDescriptor;
  label: string;
}

const Simple: React.FunctionComponent<SimpleProps> = ({
  variable,
  label,
}: SimpleProps) => {
  const instance = useVariableInstance(variable);
  if (instance === undefined) {
    return <span>{`Instance of ${variable.name} not found`}</span>;
  }
  return (
    <div>
      {label && <span>{label}</span>}
      <div>
        {'trValue' in instance
          ? TranslatableContent.toString(instance.trValue)
          : String(instance.value)}
      </div>
    </div>
  );
};

const SimpleComponent = pageComponentFactory(
  Simple,
  {
    description: 'SimpleComponent',
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
      label: {
        required: false,
        type: 'string',
        view: {
          featureLevel: 'DEFAULT',
          index: 1,
          label: 'Label',
        },
      },
    },
  },
  ['ISNumberDescriptor', 'ISStringDescriptor'],
  variable => ({
    variable: variable,
    label: TranslatableContent.toString(variable.label),
  }),
);

registerComponent('SimpleComponent', SimpleComponent);

export default SimpleComponent;
