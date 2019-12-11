import * as React from 'react';
import { Actions } from '../../data';
import { store } from '../../data/store';
import { pageComponentFactory, registerComponent } from './componentFactory';
import { schemaProps } from './schemaProps';
import { wlog } from '../../Helper/wegaslog';

interface ButtonProps {
  label: string;
  action: IScript | string;
}

const Button: React.FunctionComponent<ButtonProps> = (props: ButtonProps) => {
  const { label, action } = props;
  wlog(action);
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
        "",
      label: 'Button',
    }),
  ),
);
