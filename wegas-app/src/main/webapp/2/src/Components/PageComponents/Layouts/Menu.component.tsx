import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { MenuProps, Menu, menuSchema } from '../../Layouts/Menu';

// interface PlayerMenuProps extends MenuProps {
//     /**
//      * selected - the state of the parent array
//      */
//     selected?: number[];
//     /**
//      * children - the array containing the child components
//      */
//     children: React.ReactNode[];
// }

function PlayerMenu({ children, ...props }: MenuProps) {
  //const computedActive = selected?.slice(0, 1)[0];
  //   const [activeItem, setActiveItem] = React.useState<number>();

  //   React.useEffect(() => {
  //     setActiveItem(selected?.slice(0, 1)[0]);
  //   }, [selected]);

  return <Menu {...props}>{children}</Menu>;
}

registerComponent(
  pageComponentFactory(
    PlayerMenu,
    'Layout',
    'Menu',
    'bars',
    {
      ...menuSchema,
    },
    [],
    () => ({
      children: [],
    }),
    'MENU',
  ),
);
