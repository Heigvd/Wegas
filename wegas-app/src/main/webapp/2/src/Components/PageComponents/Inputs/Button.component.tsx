import * as React from 'react';
import { Actions } from '../../../data';
import { store } from '../../../data/store';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { Button } from '../../Inputs/Buttons/Button';

interface PlayerButtonProps extends PageComponentMandatoryProps {
  label: string;
  action: IScript | string;
}

const PlayerButton: React.FunctionComponent<PlayerButtonProps> = (
  props: PlayerButtonProps,
) => {
  const { label, action, EditHandle } = props;
  return (
    <>
      <EditHandle />
      <Button
        label={label}
        onClick={() =>
          store.dispatch(Actions.VariableInstanceActions.runScript(action))
        }
      />
    </>
  );
};

registerComponent(
  pageComponentFactory(
    PlayerButton,
    'Button',
    'cube',
    {
      action: schemaProps.script('Action', undefined, 'SET'),
      label: schemaProps.string('Label'),
    },
    [],
    () => ({
      action: '',
      label: 'Button',
    }),
  ),
);
