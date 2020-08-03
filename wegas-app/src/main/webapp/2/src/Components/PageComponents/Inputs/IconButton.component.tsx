import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { icons } from '../../../Editor/Components/Views/FontAwesome';
import { PlayerButtonProps, buttonSchema } from './Button.component';
import { createScript } from '../../../Helper/wegasEntites';
import { store } from '../../../data/store';
import { Actions } from '../../../data';

interface PlayerIconButtonProps extends PlayerButtonProps {
  icon: IconName;
  prefixedLabel?: boolean;
}

function PlayerIconButton(props: PlayerIconButtonProps) {
  return (
    <IconButton
      {...props}
      onClick={() =>
        store.dispatch(Actions.VariableInstanceActions.runScript(props.action!))
      }
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerIconButton,
    componentType: 'Input',
    name: 'IconButton',
    icon: 'cube',
    schema: {
      ...buttonSchema,
      icon: schemaProps.select('Icon', true, Object.keys(icons)),
      prefixedLabel: schemaProps.boolean('Prefixed label', false),
    },
    getComputedPropsFromVariable: () => ({
      icon: 'cube' as IconName,
      label: 'IconButton',
      action: createScript(),
    }),
  }),
);
