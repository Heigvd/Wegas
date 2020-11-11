import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import {
  MenuProps,
  Menu,
  menuSchema,
  MenuItem,
  defaultMenuItemKeys,
} from '../../Layouts/Menu';
import { childrenDeserializerFactory } from './FlexList.component';
import { classAndStyleShema } from '../tools/options';

interface PlayerMenuProps extends MenuProps, WegasComponentProps {
  /**
   * children - the array containing the child components
   */
  children: React.ReactNode[];
}

function PlayerMenu(props: PlayerMenuProps) {
  return <Menu {...props} />;
}

function isVertical(props: PlayerMenuProps) {
  return props.vertical;
}

registerComponent(
  pageComponentFactory({
    component: PlayerMenu,
    componentType: 'Layout',
    container: {
      type: 'MENU',
      isVertical,
      ChildrenDeserializer: childrenDeserializerFactory(
        MenuItem,
        defaultMenuItemKeys,
      ),
    },
    dropzones: {},
    name: 'Menu',
    icon: 'bars',
    schema: { ...menuSchema, ...classAndStyleShema },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
