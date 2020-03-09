import * as React from 'react';
import { Actions } from '../../../data';
import { store } from '../../../data/store';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { Button } from '../../Inputs/Buttons/Button';
import { PageComponentMandatoryProps } from '../tools/EditableComponent';
import { createScript } from '../../../Helper/wegasEntites';

export interface PlayerButtonProps extends PageComponentMandatoryProps {
  label: string;
  script: IScript;
}

const PlayerButton: React.FunctionComponent<PlayerButtonProps> = (
  props: PlayerButtonProps,
) => {
  const { ComponentContainer, childProps, flexProps } = extractProps(props);
  return (
    <ComponentContainer flexProps={flexProps}>
      <Button
        label={childProps.label}
        onClick={() =>
          store.dispatch(
            Actions.VariableInstanceActions.runScript(childProps.script!),
          )
        }
      />
    </ComponentContainer>
  );
};

export const buttonSchema = {
  action: schemaProps.script('Action', undefined, 'SET'),
  label: schemaProps.string('Label'),
};

registerComponent(
  pageComponentFactory(
    PlayerButton,
    'Button',
    'cube',
    buttonSchema,
    [],
    () => ({
      script: createScript(),
      label: 'Button',
    }),
  ),
);
