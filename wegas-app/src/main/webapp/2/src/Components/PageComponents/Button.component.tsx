import * as React from 'react';
import { Actions } from '../../data';
import { store } from '../../data/store';
import { pageComponentFactory, registerComponent } from './componentFactory';
import { schemaProps } from './schemaProps';

interface ButtonProps {
  label: string;
  action: IScript | string;
}

const Button: React.FunctionComponent<ButtonProps> = (props: ButtonProps) => {
  const { label, action } = props;
  return (
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
  );
};

registerComponent(
  pageComponentFactory(
    Button,
    'Button',
    'cube',
    {
      action: schemaProps.script('Action'),
      label: schemaProps.string('Label'),
    },
    [],
    () => ({
      action:
        "Variable.find(gameModel, 'zzzz').setValue(self, Math.random()*2000);",
      label: 'Button',
    }),
  ),
);
