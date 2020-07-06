import * as React from 'react';
import { cx, css } from 'emotion';
import { classNameOrEmpty } from '../../Helper/className';
import { flex, flexColumn, flexRow, layoutStyle } from '../../css/classes';
import { WegasComponentItemProps } from '../PageComponents/tools/EditableComponent';
import { themeVar } from '../Style/ThemeVars';

const ITEM_SELECTOR = 'menu-item';
const VERTICAL_SELECTOR = 'menu-vertical';
const HORIZONTAL_SELECTOR = 'menu-horizontal';
const SELECTED_SELECTOR = 'menu-selected';

const menuItemStyle = css({
  borderStyle: 'solid',
  borderWidth: themeVar.Common.dimensions.BorderWidth,
  borderColor: themeVar.Common.colors.BorderColor,
  margin: '2px',
  ':hover': {
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
});

const menuItemSelectStyle = css({
  [`&>.${ITEM_SELECTOR}.${SELECTED_SELECTOR}`]: {
    borderColor: themeVar.Common.colors.ActiveColor,
  },
});

export interface MenuProps extends ClassAndStyle {
  selectItem?: number;
  vertical?: boolean;
  alwaysSelected?: boolean;
  onItemSelect?: (item?: number) => void;
}

interface MenuItemProps extends WegasComponentItemProps {
  // flexInit?: number;
}

export function Menu({
  vertical,
  alwaysSelected,
  onItemSelect,
  selectItem,
  className,
  style,
  children,
}: React.PropsWithChildren<MenuProps>) {
  const childrenItems = React.useRef<HTMLDivElement[]>([]);
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
      const divTarget = target as HTMLDivElement;
      const itemIndex = childrenItems.current.indexOf(divTarget);

      if (itemIndex !== -1) {
        if (selectedItem === itemIndex && !alwaysSelected) {
          setSelectedItem(undefined);
          onItemSelect && onItemSelect(undefined);
        } else {
          setSelectedItem(itemIndex);
          onItemSelect && onItemSelect(itemIndex);
        }
      }
    },
    [selectedItem, alwaysSelected, onItemSelect],
  );

  return (
    <div
      ref={e => {
        e?.childNodes.forEach(v => {
          const child = v as HTMLDivElement;
          if (child.className.includes(ITEM_SELECTOR)) {
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
          vertical ? flexColumn : flexRow,
          layoutStyle,
          menuItemSelectStyle,
        ) + classNameOrEmpty(className)
      }
      style={style}
    >
      {children}
    </div>
  );
}

export const MenuItem = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<MenuItemProps>
>((props, ref) => {
  const {
    className,
    style,
    children,
    onClick,
    onMouseOver,
    onMouseLeave,
    onDragEnter,
    onDragLeave,
    onDragEnd,
    tooltip,
  } = props;
  return (
    <div
      ref={ref}
      className={
        ITEM_SELECTOR + ' ' + menuItemStyle + classNameOrEmpty(className)
      }
      style={style}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      title={tooltip}
    >
      {children}
    </div>
  );
});
