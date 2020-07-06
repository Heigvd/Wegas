// import * as React from 'react';
// import {
//   pageComponentFactory,
//   registerComponent,
// } from '../tools/componentFactory';
// import { schemaProps } from '../tools/schemaProps';
// import { WegasFunctionnalComponentProps } from '../tools/EditableComponent';
// import { useComponentScript } from '../../Hooks/useComponentScript';
// import {
//   FlexItemProps,
//   FlexList,
//   flexListSchema,
// } from '../../Layouts/FlexList';

// export interface PlayerMenuItemProps extends FlexItemProps {
//   /**
//    * onSelectChange - called when the selection change
//    */
//   onSelectChange?: (item: number[]) => void;
// }

// interface PlayerMenuProps extends WegasFunctionnalComponentProps {
//   /**
//    * selected - the state of the parent array
//    */
//   selected?: number[];
//   /**
//    * children - the array containing the child components
//    */
//   children: React.ReactNode[];
// }

// function PlayerMenu({ selected, children, ...flexlistProps }: PlayerMenuProps) {
//   //const computedActive = selected?.slice(0, 1)[0];
//   const [activeItem, setActiveItem] = React.useState<number>();

//   React.useEffect(() => {
//     setActiveItem(selected?.slice(0, 1)[0]);
//   }, [selected]);

//   return <FlexList {...flexlistProps}>{children}</FlexList>;
// }

// registerComponent(
//   pageComponentFactory(
//     PlayerMenu,
//     'Layout',
//     'Menu',
//     'bars',
//     {
//       ...flexListSchema,
//     },
//     [],
//     () => ({
//       children: [],
//     }),
//     'MENU',
//   ),
// );
