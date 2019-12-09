import * as React from 'react';
import { Actions } from '../../data';
import { store } from '../../data/store';
import { pageComponentFactory, registerComponent } from './componentFactory';
import {
  EditableComponent,
  EditableComponentCallbacks,
} from './EditableComponent';
import { schemaProps } from './schemaProps';

interface ButtonProps extends EditableComponentCallbacks {
  label: string;
  action: IScript | string;
}

const Button: React.FunctionComponent<ButtonProps> = (props: ButtonProps) => {
  const { label, action } = props;
  return (
    <EditableComponent {...props} componentName="Button">
      {() => (
        <button
          onClick={() => {
            store.dispatch(
              Actions.VariableInstanceActions.runScript(
                typeof action === 'string' ? action : action.content,
              ),
            );
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
      action: schemaProps.script('Action'),
      label: schemaProps.string('Label'),
    },
  },
  [],
  () => ({
    action:
      "Variable.find(gameModel, 'zzzz').setValue(self, Math.random()*2000);",
    label: 'Button',
  }),
);

registerComponent('Button', ButtonComponent);
