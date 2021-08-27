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
  // defaultMenuItemKeys,
  menuItemSchema,
} from '../../Layouts/Menu';
import { childrenDeserializerFactory } from './FlexList.component';
import { classStyleIdShema } from '../tools/options';
import { defaultFlexLayoutOptionsKeys } from '../../Layouts/FlexList';

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
      isVertical,
      ChildrenDeserializer: childrenDeserializerFactory(
        MenuItem,
        // defaultMenuItemKeys,
      ),
      childrenSchema: menuItemSchema,
      childrenLayoutKeys: defaultFlexLayoutOptionsKeys,
    },
    dropzones: {},
    name: 'Menu',
    icon: 'bars',
    illustration: 'menu',
    schema: { ...menuSchema, ...classStyleIdShema },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
