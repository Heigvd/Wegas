import * as React from 'react';
import { Actions } from '../../../data';
import { store } from '../../../data/store';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { Button } from '../../Inputs/Buttons/Button';
import { createScript } from '../../../Helper/wegasEntites';
import { WegasFunctionnalComponentProps } from '../tools/EditableComponent';

export interface PlayerButtonProps extends WegasFunctionnalComponentProps {
  label: string;
  action: IScript;
}

const PlayerButton: React.FunctionComponent<PlayerButtonProps> = ({
  label,
  action,
  style,
}: PlayerButtonProps) => {
  return (
    <Button
      label={label}
      onClick={() =>
        store.dispatch(Actions.VariableInstanceActions.runScript(action!))
      }
      style={{ margin: 'auto', ...style }}
    />
  );
};

export const buttonSchema = {
  action: schemaProps.script('Action', undefined, 'SET'),
  label: schemaProps.string('Label'),
};

registerComponent(
  pageComponentFactory(
    PlayerButton,
    'Input',
    'Button',
    'cube',
    buttonSchema,
    [],
    () => ({
      action: createScript(),
      label: 'Button',
    }),
  ),
);
