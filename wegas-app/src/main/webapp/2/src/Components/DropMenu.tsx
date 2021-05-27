import * as React from 'react';
import Downshift, { StateChangeOptions } from 'downshift';
import { css, cx } from 'emotion';
import { withDefault } from '../Editor/Components/Views/FontAwesome';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { themeVar } from './Theme/ThemeVars';
import { classNameOrEmpty } from '../Helper/className';
import { ConfirmButton } from './Inputs/Buttons/ConfirmButton';
import { flexRow, flex, itemCenter } from '../css/classes';
import { lastKeyboardEvents } from '../Helper/keyboardEvents';
import { Button } from './Inputs/Buttons/Button';
import { deepDifferent } from './Hooks/storeHookFactory';

const childDropMenuButtonStyle = css({
  backgroundColor: 'inherit',
  color: 'inherit',
  '&:not(.disabled):not(.readOnly):not(.iconOnly):not(.noBackground):not(.confirmBtn):hover':
    {
      backgroundColor: 'inherit',
      color: 'inherit',
    },
});

interface ContainerValues {
  left: number;
  width: number;
  top: number;
  height: number;
}

function overflowLeft(values: ContainerValues) {
  return values.left < 0;
}
function overflowRight(values: ContainerValues) {
  return values.left + values.width > window.innerWidth;
}

function ajustHorizontally(values: ContainerValues) {
  const newValues = values;

  // Check left
  if (overflowLeft(newValues)) {
    // Move right
    newValues.left = 0;
  }
  // Check right
  if (overflowRight(newValues)) {
    // Move left
    newValues.left = window.innerWidth - newValues.width;
  }
  // Check left again
  if (overflowLeft(newValues)) {
    // Move right
    newValues.left = 0;
    // Element too big, shrink width
    newValues.width = window.innerWidth;
  }
  return newValues;
}

function overflowTop(values: ContainerValues) {
  return values.top < 0;
}
function overflowBottom(values: ContainerValues) {
  return values.top + values.height > window.innerHeight;
}

function ajustVertically(values: ContainerValues) {
  const newValues = values;

  // Check top
  if (overflowTop(newValues)) {
    // Move bottom
    newValues.top = 0;
  }
  // Check bottom
  if (overflowBottom(newValues)) {
    // Move top
    newValues.top = window.innerHeight - newValues.height;
  }
  // Check top again
  if (overflowTop(newValues)) {
    // Move bottom
    newValues.top = 0;
    // Element too big, shrink height
    newValues.height = window.innerHeight;
  }
  return newValues;
}

function ajustVerticalOverlap(values: ContainerValues, parent: HTMLElement) {
  let newTopUp = parent.getBoundingClientRect().top - values.height;
  const newTopDown =
    parent.getBoundingClientRect().top + parent.getBoundingClientRect().height;
  let newHeightUp = values.height;
  let newHeightDown = values.height;

  if (newTopUp < 0) {
    newTopUp = 0;
    newHeightUp = parent.getBoundingClientRect().top;
  }
  if (newTopDown + newHeightDown > window.innerHeight) {
    newHeightDown = window.innerHeight - newTopDown;
  }

  if (newHeightUp > newHeightDown) {
    return {
      ...values,
      top: newTopUp,
      height: newHeightUp,
    };
  } else {
    return {
      ...values,
      top: newTopDown,
      height: newHeightDown,
    };
  }
}

function ajustHorizontalOverlap(values: ContainerValues, parent: HTMLElement) {
  let newLeftUp = parent.getBoundingClientRect().left - values.width;
  const newLeftDown =
    parent.getBoundingClientRect().left + parent.getBoundingClientRect().width;
  let newWidthUp = values.width;
  let newWidthDown = values.width;

  if (newLeftUp < 0) {
    newLeftUp = 0;
    newWidthUp = parent.getBoundingClientRect().left;
  }
  if (newLeftDown + newWidthDown > window.innerWidth) {
    newWidthDown = window.innerWidth - newLeftDown;
  }

  if (newWidthUp > newWidthDown) {
    return {
      ...values,
      left: newLeftUp,
      width: newWidthUp,
    };
  } else {
    return {
      ...values,
      left: newLeftDown,
      width: newWidthDown,
    };
  }
}

interface ParentAndChildrenRectangles {
  childrenTop: number;
  childrenLeft: number;
  childrenBottom: number;
  childrenRight: number;
  parentTop: number;
  parentLeft: number;
  parentBottom: number;
  parentRight: number;
}

export type DropMenuDirection = 'left' | 'down' | 'right' | 'up';

function valuesToSides(
  values: ContainerValues,
  parent: HTMLElement,
): ParentAndChildrenRectangles {
  const { top: childrenTop, left: childrenLeft } = values;
  const childrenBottom = childrenTop + values.height;
  const childrenRight = childrenLeft + values.width;

  const { top: parentTop, left: parentLeft } = parent.getBoundingClientRect();
  const parentBottom = parentTop + parent.getBoundingClientRect().height;
  const parentRight = parentLeft + parent.getBoundingClientRect().width;

  return {
    childrenTop,
    childrenLeft,
    childrenBottom,
    childrenRight,
    parentTop,
    parentLeft,
    parentBottom,
    parentRight,
  };
}

function isOverlappingHorizontally(
  values: ContainerValues,
  parent: HTMLElement,
) {
  const { childrenRight, parentLeft, childrenLeft, parentRight } =
    valuesToSides(values, parent);
  if (childrenRight <= parentLeft || childrenLeft >= parentRight) {
    return false;
  }

  return true;
}

function isOverlappingVertically(values: ContainerValues, parent: HTMLElement) {
  const { childrenBottom, parentTop, childrenTop, parentBottom } =
    valuesToSides(values, parent);
  if (childrenBottom <= parentTop || childrenTop >= parentBottom) {
    return false;
  }

  return true;
}

export function justifyDropMenu(
  menu: HTMLElement | null,
  direction: DropMenuDirection,
) {
  const vertical = direction === 'down' || direction === 'up';

  const selector = menu?.parentElement;
  if (menu != null && selector != null) {
    const { width: containerWidth, height: containerHeight } =
      menu.getBoundingClientRect();

    let values: ContainerValues = {
      left: vertical
        ? selector.getBoundingClientRect().left
        : direction === 'left'
        ? selector.getBoundingClientRect().left - containerWidth
        : selector.getBoundingClientRect().left +
          selector.getBoundingClientRect().width,
      width: containerWidth,
      top: !vertical
        ? selector.getBoundingClientRect().top
        : direction === 'up'
        ? selector.getBoundingClientRect().top - containerHeight
        : selector.getBoundingClientRect().top +
          selector.getBoundingClientRect().height,
      height: containerHeight,
    };

    // moving menu list into the visible window
    values = ajustHorizontally(values);
    values = ajustVertically(values);

    if (vertical && isOverlappingVertically(values, selector)) {
      values = ajustVerticalOverlap(values, selector);
    } else if (!vertical && isOverlappingHorizontally(values, selector)) {
      values = ajustHorizontalOverlap(values, selector);
    }

    menu.style.setProperty('left', values.left + 'px');
    if (values.width !== containerWidth) {
      menu.style.setProperty('width', values.width + 'px');
    }
    menu.style.setProperty('top', values.top + 'px');
    menu.style.setProperty('height', values.height + 'px');
  }
}

export type SelecteDropdMenuItem<
  T,
  MItem extends DropMenuItem<T> = DropMenuItem<T>,
> = MItem & {
  path: number[];
  value: Exclude<MItem['value'], undefined>;
};

export interface DropMenuProps<
  T,
  MItem extends DropMenuItem<T> = DropMenuItem<T>,
> {
  id?: string;
  onSelect?: (
    item: SelecteDropdMenuItem<T, MItem>,
    keyEvent: ModifierKeysEvent,
  ) => void;
  onOpen?: () => void;
  items: readonly MItem[];
  label?: React.ReactNode;
  prefixedLabel?: boolean;
  path?: number[];
  icon?: IconName;
  direction?: DropMenuDirection;
  containerClassName?: string;
  buttonClassName?: string;
  listClassName?: string;
  adder?: React.ReactNode;
  deleter?: {
    filter?: (item: MItem) => boolean;
    onDelete: (item: MItem) => void;
  };
  noBackground?: boolean;
  style?: React.CSSProperties;
  selected?: T | T[];
}
/**
 * returns an empty string
 */
function emtpyStr(): '' {
  return '';
}
const itemStyle = css({
  width: '100%',
  cursor: 'pointer',
  ':hover': {
    textShadow: '0 0 1px',
  },
});
const containerStyle = css({
  display: 'inline-block',
  position: 'relative',
});
const subMenuContainer = css({
  color: themeVar.colors.DarkTextColor,
  backgroundColor: themeVar.colors.BackgroundColor,
  position: 'fixed',
  overflow: 'auto',
  maxHeight: '500px',
  maxWidth: '500px',
  zIndex: 10000,
  whiteSpace: 'nowrap',
  margin: '2px',
  boxShadow: `0px 0px 4px 1px ${themeVar.colors.PrimaryColor}`,
  '>div': {
    padding: '1px',
    borderRadius: '3px',
  },
  [`& .${containerStyle}`]: {
    width: '100%',
  },
});
const subMenuItemContainer = (isSelected: boolean) =>
  cx(
    flex,
    flexRow,
    itemCenter,
    css({
      cursor: 'pointer',
      userSelect: 'none',
      marginLeft: '5px',
      marginRight: '5px',
      backgroundColor: isSelected ? themeVar.colors.ActiveColor : undefined,
      color: isSelected ? themeVar.colors.LightTextColor : undefined,
      ':hover': {
        backgroundColor: themeVar.colors.HoverColor,
        color: themeVar.colors.HoverTextColor,
      },
    }),
  );

function stopPropagation(ev: React.MouseEvent<HTMLElement>) {
  ev.stopPropagation();
}

// function listenOnScroll(event: Event) {
//   wlog(event);
//   debugger;
// }

export function DropMenu<T, MItem extends DropMenuItem<T>>({
  id,
  onOpen,
  onSelect,
  direction = 'down',
  label,
  prefixedLabel = true,
  path,
  items,
  icon,
  containerClassName,
  buttonClassName,
  listClassName,
  adder,
  deleter,
  noBackground,
  style,
  selected,
}: DropMenuProps<T, MItem>) {
  const onStateChange = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: StateChangeOptions<any>) => {
      if (changes.isOpen != null && changes.isOpen) {
        onOpen && onOpen();
      }
    },
    [onOpen],
  );

  // React.useEffect(() => {
  //   window.addEventListener('scroll', listenOnScroll, true);
  //   return window.removeEventListener('scroll', listenOnScroll);
  // }, []);

  return (
    <Downshift
      onStateChange={onStateChange}
      onSelect={(i: MItem) => {
        if (onSelect) {
          onSelect(
            {
              ...i,
              value: i.value as Exclude<MItem['value'], undefined>,
              path: path || [],
            },
            lastKeyboardEvents,
          );
        }
      }}
      itemToString={emtpyStr}
    >
      {({ getItemProps, isOpen, toggleMenu, closeMenu }) => (
        <div id={id} className={containerClassName} style={style}>
          <div className={itemStyle} onClick={() => toggleMenu()}>
            <Button
              label={label}
              prefixedLabel={prefixedLabel}
              icon={withDefault(
                icon,
                !adder && items.length === 0
                  ? { icon: 'circle', size: 'sm' }
                  : { icon: `caret-${direction}` as IconName },
              )}
              onClick={ev => {
                ev.stopPropagation();
                toggleMenu();
              }}
              className={buttonClassName}
              noBackground={noBackground}
            />
          </div>

          {isOpen && (
            <div
              className={subMenuContainer + classNameOrEmpty(listClassName)}
              ref={n => {
                justifyDropMenu(n, direction);
              }}
            >
              {adder && (
                <div className={subMenuItemContainer(false)}>{adder}</div>
              )}
              {items.map((item: MItem, index: number) => {
                const newPath = [...(path ? path : []), index];
                const trasher =
                  deleter && (!deleter.filter || deleter.filter(item)) ? (
                    <ConfirmButton
                      icon="trash"
                      onAction={() => deleter.onDelete(item)}
                    />
                  ) : null;

                const isSelected =
                  selected == null
                    ? false
                    : Array.isArray(selected)
                    ? !deepDifferent(selected[0], item.value)
                    : !deepDifferent(selected, item.value);

                if (Array.isArray(item.items)) {
                  return (
                    <div
                      key={index}
                      {...(!item.disabled
                        ? getItemProps({
                            item: item,
                            onClick: stopPropagation,
                          })
                        : undefined)}
                      className={
                        subMenuItemContainer(isSelected) +
                        classNameOrEmpty(item.className)
                      }
                      style={item.style}
                    >
                      <DropMenu
                        onSelect={(v, e) => {
                          closeMenu();
                          if (onSelect) {
                            onSelect(v as SelecteDropdMenuItem<T, MItem>, e);
                          }
                        }}
                        items={item.items}
                        direction={direction === 'right' ? 'left' : 'right'}
                        label={item.label}
                        selected={
                          Array.isArray(selected)
                            ? selected.slice(1)
                            : undefined
                        }
                        path={newPath}
                        buttonClassName={childDropMenuButtonStyle}
                      />
                      {trasher}
                    </div>
                  );
                }
                return (
                  <div
                    key={index}
                    {...(!item.disabled
                      ? getItemProps({
                          className: itemStyle,
                          item: item,
                          onClick: stopPropagation,
                        })
                      : undefined)}
                    className={
                      subMenuItemContainer(isSelected) +
                      classNameOrEmpty(item.className)
                    }
                  >
                    {item.label}
                    {trasher}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Downshift>
  );
}
