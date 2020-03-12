import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { icons } from '../../../Editor/Components/Views/FontAwesome';
import { PlayerButtonProps, buttonSchema } from './Button.component';
import { createScript } from '../../../Helper/wegasEntites';

interface PlayerIconButtonProps extends PlayerButtonProps {
  icon: IconName;
  prefixedLabel?: boolean;
}

function PlayerIconButton(props: PlayerIconButtonProps) {
  const { ComponentContainer, childProps, flexProps } = extractProps(props);
  return (
    <ComponentContainer flexProps={flexProps}>
      <IconButton {...childProps} />
    </ComponentContainer>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerIconButton,
    'IconButton',
    'cube',
    {
      ...buttonSchema,
      icon: schemaProps.select('Icon', true, Object.keys(icons)),
      prefixedLabel: schemaProps.boolean('Prefixed label', false),
    },
    [],
    () => ({
      icon: 'cube' as IconName,
      label: 'IconButton',
      action: createScript(),
    }),
  ),
);
