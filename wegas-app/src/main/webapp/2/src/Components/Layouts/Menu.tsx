import * as React from 'react';
import { cx, css } from 'emotion';
import { classNameOrEmpty } from '../../Helper/className';
import {
  flex,
  flexColumn,
  flexRow,
  layoutStyle,
  grow,
  contentCenter,
  flexDistribute,
} from '../../css/classes';
import { themeVar } from '../Style/ThemeVars';
import { WegasComponentItemProps } from '../PageComponents/tools/EditableComponent';
import { HashListChoices } from '../../Editor/Components/FormView/HashList';
import { schemaProps } from '../PageComponents/tools/schemaProps';

const MENU_ITEM_SELECTOR = 'menu-item';
const VERTICAL_SELECTOR = 'menu-vertical';
const HORIZONTAL_SELECTOR = 'menu-horizontal';
const SELECTED_SELECTOR = 'menu-selected';
const UNSELECTABLE_SELECTOR = 'menu-unselectable';

const menuItemStyle = css({
  cursor: 'pointer',
  borderStyle: 'solid',
  borderWidth: themeVar.Common.dimensions.BorderWidth,
  borderColor: themeVar.Common.colors.BorderColor,
  margin: '2px',
  ':hover': {
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
});

const menuItemSelectStyle = css({
  [`&>.${MENU_ITEM_SELECTOR}.${SELECTED_SELECTOR}`]: {
    borderColor: themeVar.Common.colors.ActiveColor,
  },
});

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

export interface MenuProps extends React.PropsWithChildren<ClassAndStyle> {
  selectItem?: number;
  vertical?: boolean;
  // alwaysSelected?: boolean;
  onItemSelect?: (item?: number) => void;
}

export function Menu({
  vertical,
  // alwaysSelected,
  onItemSelect,
  selectItem,
  className,
  style,
  children,
}: MenuProps) {
  const childrenItems = React.useRef<HTMLElement[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<number | undefined>(
    selectItem,
  );

  React.useEffect(() => {
    setSelectedItem(selectItem);
  }, [selectItem]);

  React.useEffect(() => {
    childrenItems.current.map(children => {
      children.className = children.className.replace(
        ' ' + SELECTED_SELECTOR,
        '',
      );
    });

    childrenItems.current.map(children => {
      children.className = children.className.replace(
        ' ' + SELECTED_SELECTOR,
        '',
      );
    });

    if (selectedItem != null) {
      childrenItems.current[selectedItem].className += ' ' + SELECTED_SELECTOR;
    }
  }, [selectedItem]);

  const manageOnClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const { target } = e;
      let divTarget: HTMLElement | null = target as HTMLElement | null;
      while (
        divTarget != null &&
        !divTarget.className.includes(MENU_ITEM_SELECTOR)
      ) {
        divTarget = divTarget.parentElement as HTMLElement;
      }

      if (divTarget != null) {
        const itemIndex = childrenItems.current.indexOf(divTarget);

        if (
          itemIndex !== -1 &&
          !divTarget.className.includes(UNSELECTABLE_SELECTOR)
        ) {
          /* if (selectedItem === itemIndex && !alwaysSelected) {
            setSelectedItem(undefined);
            onItemSelect && onItemSelect(undefined);
          } else
          */
          {
            setSelectedItem(itemIndex);
            onItemSelect && onItemSelect(itemIndex);
          }
        }
      }
    },
    [/*selectedItem, alwaysSelected,*/ onItemSelect],
  );

  return (
    <div
      ref={e => {
        e?.childNodes.forEach(v => {
          const child = v as HTMLDivElement;
          if (child.className.includes(MENU_ITEM_SELECTOR)) {
            if (vertical && !child.className.includes(VERTICAL_SELECTOR)) {
              child.className += ' ' + VERTICAL_SELECTOR;
            } else if (
              !vertical &&
              !child.className.includes(HORIZONTAL_SELECTOR)
            ) {
              child.className += ' ' + HORIZONTAL_SELECTOR;
            }
            childrenItems.current.push(child);
          }
        });
      }}
      onClick={manageOnClick}
      className={
        cx(
          flex,
          grow,
          vertical ? flexColumn : flexRow,
          flexDistribute,
          layoutStyle,
          menuItemSelectStyle,
        ) + classNameOrEmpty(className)
      }
      style={{
        // flexDirection,
        // flexWrap,
        // justifyContent,
        // alignItems,
        // alignContent,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export const menuItemSchema: HashListChoices = [
  {
    label: 'Unselectable',
    value: {
      prop: 'unselectable',
      schema: schemaProps.boolean({ label: 'Unselectable' }),
    },
  },
];

export const defaultMenuItemProps: MenuItemProps = {
  unselectable: undefined,
};
export const defaultMenuItemKeys = Object.keys(defaultMenuItemProps) as (keyof MenuItemProps)[];

interface MenuItemProps
  extends React.PropsWithChildren<WegasComponentItemProps> {
  unselectable?: boolean;
}

export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(
  (props, ref) => {
    const { unselectable, className, style, children, ...restProps } = props;
    return (
      <div
        ref={ref}
        className={
          MENU_ITEM_SELECTOR +
          ' ' +
          (unselectable ? UNSELECTABLE_SELECTOR + ' ' : '') +
          cx(flex, contentCenter, menuItemStyle) +
          classNameOrEmpty(className)
        }
        style={{
          position: 'relative',
          ...style,
        }}
        {...restProps}
      >
        {children}
      </div>
    );
  },
);
