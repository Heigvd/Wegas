import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { Centered, CenteredProps } from '../../Layouts/Centered';

function PlayerCentered({
  className,
  children,
}: CenteredProps<WegasComponent[]> & PageComponentMandatoryProps) {
  return <Centered className={className}>{children}</Centered>;
}

registerComponent(
  pageComponentFactory(
    PlayerCentered,
    'Centered',
    'align-center',
    {
      className: schemaProps.string('ClassName', false),
      children: schemaProps.hidden(false),
    },
    [],
    () => ({}),
  ),
);
