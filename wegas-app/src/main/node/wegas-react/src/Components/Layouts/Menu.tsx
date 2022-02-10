import { cx } from '@emotion/css';
import * as React from 'react';
import {
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
  grow,
} from '../../css/classes';
import { entityIs } from '../../data/entities';
import { classNameOrEmpty } from '../../Helper/className';
import { createScript } from '../../Helper/wegasEntites';
import { useScript } from '../Hooks/useScript';
import { WegasComponentItemProps } from '../PageComponents/tools/EditableComponent';
import { schemaProps } from '../PageComponents/tools/schemaProps';
// import { themeVar } from '../Theme/ThemeVars';

// const MENU_ITEM_SELECTOR = 'menu-item';
// const VERTICAL_SELECTOR = 'menu-vertical';
// const HORIZONTAL_SELECTOR = 'menu-horizontal';
// const SELECTED_SELECTOR = 'menu-selected';
// const UNSELECTABLE_SELECTOR = 'menu-unselectable';

// const menuItemStyle = css({
//   cursor: 'pointer',
//   borderStyle: 'solid',
//   borderWidth: themeVar.dimensions.BorderWidth,
//   borderColor: themeVar.colors.PrimaryColor,
//   margin: '2px',
//   ':hover': {
//     backgroundColor: themeVar.colors.HoverColor,
//   },
// });

// const menuItemSelectStyle = css({
//   [`&>.${MENU_ITEM_SELECTOR}.${SELECTED_SELECTOR}`]: {
//     borderColor: themeVar.colors.ActiveColor,
//   },
// });

export const menuSchema = {
  vertical: schemaProps.boolean({ label: 'Vertical' }),
  onItemSelect: schemaProps.customScript({
    label: 'On item select',

    returnType: ['void'],
    language: 'TypeScript',
    args: [['item', ['number']]],
  }),
  // alwaysSelected: schemaProps.boolean('Always selected',true,true),
};

export type MenuChildren = {
  [id: string]: { label: React.ReactNode | IScript; content: React.ReactNode };
};

export function MenuLabel({
  onClick,
  selected,
  label,
}: {
  onClick: () => void;
  selected: boolean;
  label: React.ReactNode | IScript;
}) {
  const isScript = entityIs(label, 'Script');
  const labelScript = useScript(
    isScript ? (label as IScript) : createScript(''),
  );
  const labelValue = isScript ? labelScript : label;
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: selected ? 'red' : 'white',
        cursor: 'pointer',
      }}
    >
      {labelValue}
    </div>
  );
}

export interface MenuProps<T extends MenuChildren = MenuChildren>
  extends ClassStyleId {
  // selectItem?: number;
  vertical?: boolean;
  // alwaysSelected?: boolean;
  // onItemSelect?: (item?: number) => void;
  items: T;
}

export function Menu<T extends MenuChildren = MenuChildren>({
  vertical,
  // alwaysSelected,
  // onItemSelect,
  // selectItem,
  className,
  style,
  items,
  id,
}: MenuProps<T>) {
  // const childrenItems = React.useRef<HTMLElement[]>([]);
  // const [selectedItem, setSelectedItem] = React.useState<number | undefined>(
  //   selectItem,
  // );
  const [selectedItem, setSelectedItem] = React.useState<keyof T | undefined>();

  // React.useEffect(() => {
  //   setSelectedItem(selectItem);
  // }, [selectItem]);

  // React.useEffect(() => {
  //   childrenItems.current.map(children => {
  //     children.className = children.className.replace(
  //       ' ' + SELECTED_SELECTOR,
  //       '',
  //     );
  //   });

  //   childrenItems.current.map(children => {
  //     children.className = children.className.replace(
  //       ' ' + SELECTED_SELECTOR,
  //       '',
  //     );
  //   });

  //   if (selectedItem != null) {
  //     childrenItems.current[selectedItem].className += ' ' + SELECTED_SELECTOR;
  //   }
  // }, [selectedItem]);

  // const manageOnClick = React.useCallback(
  //   (e: React.MouseEvent<HTMLDivElement>) => {
  //     e.stopPropagation();
  //     const { target } = e;
  //     let divTarget: HTMLElement | null = target as HTMLElement | null;
  //     while (
  //       divTarget != null &&
  //       !divTarget.className.includes(MENU_ITEM_SELECTOR)
  //     ) {
  //       divTarget = divTarget.parentElement as HTMLElement;
  //     }

  //     if (divTarget != null) {
  //       const itemIndex = childrenItems.current.indexOf(divTarget);

  //       if (
  //         itemIndex !== -1 &&
  //         !divTarget.className.includes(UNSELECTABLE_SELECTOR)
  //       ) {
  //         /* if (selectedItem === itemIndex && !alwaysSelected) {
  //           setSelectedItem(undefined);
  //           onItemSelect && onItemSelect(undefined);
  //         } else
  //         */
  //         {
  //           setSelectedItem(itemIndex);
  //           onItemSelect && onItemSelect(itemIndex);
  //         }
  //       }
  //     }
  //   },
  //   [/*selectedItem, alwaysSelected,*/ onItemSelect],
  // );

  return (
    <div
      // ref={e => {
      //   e?.childNodes.forEach(v => {
      //     const child = v as HTMLDivElement;
      //     if (child.className.includes(MENU_ITEM_SELECTOR)) {
      //       if (vertical && !child.className.includes(VERTICAL_SELECTOR)) {
      //         child.className += ' ' + VERTICAL_SELECTOR;
      //       } else if (
      //         !vertical &&
      //         !child.className.includes(HORIZONTAL_SELECTOR)
      //       ) {
      //         child.className += ' ' + HORIZONTAL_SELECTOR;
      //       }
      //       childrenItems.current.push(child);
      //     }
      //   });
      // }}
      // onClick={manageOnClick}
      className={
        cx(
          flex,
          grow,
          vertical ? flexRow : flexColumn,
          flexDistribute,
          // menuItemSelectStyle,
        ) + classNameOrEmpty(className)
      }
      style={{
        ...style,
      }}
      id={id}
    >
      <div
        className={cx(flex, vertical ? flexColumn : flexRow, flexDistribute)}
      >
        {Object.entries(items).map(([k, v]) => (
          <MenuLabel
            key={k}
            onClick={() => setSelectedItem(k)}
            selected={selectedItem === k}
            label={v.label}
          />
        ))}
      </div>
      {selectedItem && items[selectedItem].content}
    </div>
  );
}

export const menuItemSchema: { [prop: string]: SimpleSchemaProps } = {
  componentId: schemaProps.string({ label: 'Component id', required: true }),
  componentLabel: schemaProps.scriptString({
    label: 'Component label',
    required: true,
  }),
  // unselectable: schemaProps.boolean({ label: 'Unselectable', required: true }),
};

export const defaultMenuItemProps: MenuItemProps = {
  // unselectable: undefined,
  componentId: 'An id',
  componentLabel: createScript('A label', 'Typescript'),
};
export const defaultMenuItemKeys = Object.keys(
  defaultMenuItemProps,
) as (keyof MenuItemProps)[];

export interface MenuItemProps
  extends React.PropsWithChildren<WegasComponentItemProps> {
  // unselectable?: boolean;
  componentId: string;
  componentLabel: IScript;
  onReady?: (id: string, label: React.ReactNode) => void;
  selectedItem?: string;
}

// export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(
//   (props, ref) => {
//     const {
//       // unselectable,
//       componentLabel,
//       componentId,
//       onReady,
//       selectedItem,
//       className,
//       style,
//       children,
//       ...restProps
//     } = props;
//     React.useLayoutEffect(() => {
//       onReady && onReady(componentId, componentLabel);
//     });

//     return (
//       <div
//         ref={ref}
//         // className={
//         //   MENU_ITEM_SELECTOR +
//         //   ' ' +
//         //   (unselectable ? UNSELECTABLE_SELECTOR + ' ' : '') +
//         //   cx(flex, contentCenter, menuItemStyle) +
//         //   classNameOrEmpty(className)
//         // }
//         style={{
//           position: 'relative',
//           visibility: selectedItem === componentId ? 'visible' : 'hidden',
//           ...style,
//         }}
//         {...restProps}
//       >
//         {children}
//       </div>
//     );
//   },
// );
// MenuItem.displayName = 'MenuItem';
