import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { MenuProps, Menu, menuSchema } from '../../Layouts/Menu';

interface PlayerMenuProps extends MenuProps, WegasComponentProps {
  /**
   * children - the array containing the child components
   */
  children: React.ReactNode[];
}

function PlayerMenu(props: PlayerMenuProps) {
  return <Menu {...props} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerMenu,
    componentType: 'Layout',
    containerType: 'MENU',
    name: 'Menu',
    icon: 'bars',
    schema: menuSchema
  })
);
