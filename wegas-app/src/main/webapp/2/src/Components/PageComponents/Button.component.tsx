import * as React from 'react';
import { Actions } from '../../data';
import { store } from '../../data/store';
import { pageComponentFactory, registerComponent } from './componentFactory';

interface ButtonProps {
  label: string;
  action: string;
}

const Button: React.FunctionComponent<ButtonProps> = ({
  label,
  action,
}: ButtonProps) => {
  return (
    <button
      onClick={() => {
        store.dispatch(Actions.VariableInstanceActions.runScript(action));
      }}
    >
      {label}
    </button>
  );
};

const ButtonComponent = pageComponentFactory(
  Button,
  'cube',
  {
    description: 'Button',
    properties: {
      action: {
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
  [],
  () => ({
    action: '',
    label: 'Button',
  }),
);

registerComponent('Button', ButtonComponent);
