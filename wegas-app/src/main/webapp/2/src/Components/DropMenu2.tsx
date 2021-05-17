import * as React from 'react';
import { useSelect, UseSelectState } from 'downshift';
import { css, cx } from 'emotion';
import { withDefault } from '../Editor/Components/Views/FontAwesome';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { themeVar } from './Theme/ThemeVars';
import { classNameOrEmpty, classOrNothing } from '../Helper/className';
import { lastKeyboardEvents } from '../Helper/keyboardEvents';
import { Button } from './Inputs/Buttons/Button';
import { deepDifferent } from './Hooks/storeHookFactory';
import { wlog } from '../Helper/wegaslog';

const childDropMenuButtonStyle = css({
  backgroundColor: 'inherit',
  color: 'inherit',
  '&:not(.disabled):not(.readOnly):not(.iconOnly):not(.noBackground):not(.confirmBtn):hover':
    {
      backgroundColor: 'inherit',
      color: 'inherit',
    },
});

export type DropMenuDirection = 'left' | 'down' | 'right' | 'up';

export interface DropMenuProps<
  T,
  MItem extends DropMenuItem<T> = DropMenuItem<T>,
> {
  id?: string;
  onSelect?: (item: DropMenuItem<T>, keyEvent: ModifierKeysEvent) => void;
  onOpen?: () => void;
  items: MItem[];
  label?: React.ReactNode;
  prefixedLabel?: boolean;
  path?: number[];
  icon?: IconName;
  direction?: DropMenuDirection;
  containerClassName?: string;
  buttonClassName?: string;
  listClassName?: string;
  noBackground?: boolean;
  style?: React.CSSProperties;
  selected?: T | T[];
}

const itemStyle = css({
  width: '100%',
  cursor: 'pointer',
  backgroundColor: themeVar.colors.BackgroundColor,
  color: themeVar.colors.DarkTextColor,
  ':hover': {
    backgroundColor: themeVar.colors.HoverColor,
    // color: themeVar.colors.HoverTextColor,
  },
  '&.selected': {
    backgroundColor: themeVar.colors.ActiveColor,
    color: themeVar.colors.LightTextColor,
  },
});

const menuClassName = css({
  position: 'fixed',
  overflow: 'auto',
  maxHeight: '500px',
  maxWidth: '500px',
  backgroundColor: themeVar.colors.BackgroundColor,
  color: themeVar.colors.DarkTextColor,
});

interface ContainerValues {
  left: number;
  width: number;
  top: number;
  height: number;
}

function ajustWindowLeft(values: ContainerValues) {
  if (window.innerWidth < values.left + values.width) {
    return {
      ...values,
      left: window.innerWidth - values.width,
    };
  }
  return values;
}

function ajustWindowTop(values: ContainerValues) {
  if (window.innerHeight < values.top + values.height) {
    return {
      ...values,
      top: window.innerHeight - values.height,
    };
  }
  return values;
}

function ajustOverlapLeft(values: ContainerValues, parent: HTMLElement) {
  return {
    ...values,
    left: parent.getBoundingClientRect().left - values.width,
  };
}

function ajustOverlapTop(values: ContainerValues, parent: HTMLElement) {
  return {
    ...values,
    top: parent.getBoundingClientRect().top - values.height,
  };
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

export function DropdownSelect<T, MItem extends DropMenuItem<T>>({
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
  noBackground,
  style,
  selected,
}: DropMenuProps<T, MItem>) {
  const onStateChange = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: Partial<UseSelectState<MItem>>) => {
      if (changes.isOpen != null && changes.isOpen) {
        onOpen && onOpen();
      }
    },
    [onOpen],
  );

  const onSelectedItemChange = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ selectedItem: i }: Partial<UseSelectState<MItem>>) => {
      debugger;
      if (onSelect != null && i != null) {
        onSelect(
          {
            ...i,
            value: i.value as Exclude<MItem['value'], undefined>,
            path: path || [],
          },
          lastKeyboardEvents,
        );
      }
    },
    [onSelect, path],
  );

  const { isOpen, getItemProps, toggleMenu, closeMenu } = useSelect({
    items,
    onStateChange,
    onSelectedItemChange,
  });

  const vertical = direction === 'down' || direction === 'up';

  return (
    <div
      id={id}
      className={containerClassName}
      style={style}
      onClick={e => {
        debugger;
      }}
    >
      <div>
        <Button
          label={label}
          prefixedLabel={prefixedLabel}
          icon={withDefault(
            icon,
            items.length === 0
              ? { icon: 'circle', size: 'sm' }
              : { icon: `caret-${direction}` as IconName },
          )}
          onClick={ev => {
            ev.stopPropagation();
            debugger;

            toggleMenu();
          }}
          className={buttonClassName}
          noBackground={noBackground}
        />
      </div>
      {isOpen && (
        <div
          className={cx(menuClassName, listClassName)}
          ref={menu => {
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

              values = ajustWindowLeft(values);
              values = ajustWindowTop(values);

              if (
                (direction === 'down' || direction === 'up') &&
                isOverlappingVertically(values, selector)
              ) {
                values = ajustOverlapTop(values, selector);
              } else if (
                (direction === 'left' || direction === 'right') &&
                isOverlappingHorizontally(values, selector)
              ) {
                values = ajustOverlapLeft(values, selector);
              }

              menu.style.setProperty('left', values.left + 'px');
              menu.style.setProperty('top', values.top + 'px');
            }
          }}
          onClick={e => {
            debugger;
          }}
        >
          {items.map((item: MItem, index: number) => {
            const newPath = [...(path ? path : []), index];

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
                        onClick: e => {
                          debugger;
                          e.stopPropagation();
                        },
                      })
                    : undefined)}
                  className={item.className}
                  style={item.style}
                >
                  <DropdownSelect
                    onSelect={(v, e) => {
                      debugger;
                      onSelect && onSelect(v, e);
                    }}
                    items={item.items}
                    direction={direction === 'right' ? 'left' : 'right'}
                    label={item.label}
                    selected={
                      Array.isArray(selected) ? selected.slice(1) : undefined
                    }
                    path={newPath}
                    buttonClassName={childDropMenuButtonStyle}
                  />
                </div>
              );
            }
            return (
              <div
                key={index}
                {...(!item.disabled
                  ? getItemProps({
                      className:
                        itemStyle +
                        classNameOrEmpty(item.className) +
                        classOrNothing('selected', isSelected),
                      item: item,
                      // onClick: e => {
                      //   wlog('SAMERELAPUTE');
                      //   debugger;
                      //   e.stopPropagation();
                      // },
                    })
                  : undefined)}
                onClick={() => {
                  debugger;
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
