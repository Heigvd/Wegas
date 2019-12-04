import * as React from 'react';
import { Actions } from '../../data';
import { store } from '../../data/store';
import { pageComponentFactory, registerComponent } from './componentFactory';
import {
  EditableComponent,
  EditableComponentCallbacks,
} from './EditableComponent';

interface ButtonProps extends EditableComponentCallbacks {
  label: string;
  action: string;
}

const Button: React.FunctionComponent<ButtonProps> = (props: ButtonProps) => {
  const { label, action } = props;
  return (
    <EditableComponent {...props} componentName="Button">
      {() => (
        <button
          onClick={() => {
            store.dispatch(Actions.VariableInstanceActions.runScript(action));
          }}
        >
          {label}
        </button>
      )}
    </EditableComponent>
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
