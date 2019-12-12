import * as React from 'react';
import { Actions } from '../../../data';
import { store } from '../../../data/store';
import { pageComponentFactory, registerComponent } from '../componentFactory';
import { schemaProps } from '../schemaProps';
import { Button } from '../../Inputs/Button/Button';

interface PlayerButtonProps {
  label: string;
  action: IScript | string;
}

const PlayerButton: React.FunctionComponent<PlayerButtonProps> = (
  props: PlayerButtonProps,
) => {
  const { label, action } = props;
  return (
    <Button
      label={label}
      onClick={() =>
        store.dispatch(Actions.VariableInstanceActions.runScript(action))
      }
    />
  );
};

registerComponent(
  pageComponentFactory(
    PlayerButton,
    'Button',
    'cube',
    {
      action: schemaProps.script('Action'),
      label: schemaProps.string('Label'),
    },
    [],
    () => ({
      action: '',
      label: 'Button',
    }),
  ),
);
