import { css, cx } from '@emotion/css';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import Downshift, { StateChangeOptions } from 'downshift';
import * as React from 'react';
import { expandWidth, flex, flexRow, itemCenter } from '../css/classes';
import { withDefault } from '../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../Helper/className';
import { lastKeyboardEvents } from '../Helper/keyboardEvents';
import {
  contentContainerStyle,
  DropDownDirection,
  itemStyle,
  justifyDropMenu,
} from './DropDown';
import { deepDifferent } from './Hooks/storeHookFactory';
import { Button } from './Inputs/Buttons/Button';
import { ConfirmButton } from './Inputs/Buttons/ConfirmButton';
import { themeVar } from './Theme/ThemeVars';

const childDropMenuButtonStyle = css({
  backgroundColor: 'inherit',
  color: 'inherit',
  '&:not(.disabled):not(.readOnly):not(.iconOnly):not(.noBackground):not(.confirmBtn):hover':
    {
      backgroundColor: 'inherit',
      color: 'inherit',
    },
});

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
  direction?: DropDownDirection;
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
  tooltip?: string;
}
/**
 * returns an empty string
 */
function emtpyStr(): '' {
  return '';
}

const subMenuItemContainer = (
  isSelected: boolean,
  isDisabled: boolean | undefined,
) =>
  cx(
    flex,
    flexRow,
    itemCenter,
    css({
      cursor: 'pointer',
      padding: '8px 10px',
      height: '35px',
      width: '100%',
      userSelect: 'none',
      pointerEvents: isDisabled ? 'none' : 'initial',
      opacity: isDisabled ? 0.5 : 1,
      backgroundColor: isDisabled
        ? themeVar.colors.DisabledColor
        : isSelected
        ? themeVar.colors.HeaderColor
        : undefined,
      '> *': {
        padding: 0,
        margin: 0,
      },
      ':hover': {
        backgroundColor: themeVar.colors.HeaderColor,
        color: themeVar.colors.DarkTextColor,
      },
    }),
  );

function stopPropagation(ev: React.MouseEvent<HTMLElement>) {
  ev.stopPropagation();
}

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
  tooltip,
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
          <div
            className={itemStyle}
            onClick={ev => {
              ev.stopPropagation();
              toggleMenu();
            }}
          >
            <Button
              label={label}
              prefixedLabel={prefixedLabel}
              tooltip={tooltip || undefined}
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
              className={buttonClassName + ' dropDownButton'}
              noBackground={noBackground}
            />
          </div>

          {isOpen && (
            <div
              className={
                contentContainerStyle + classNameOrEmpty(listClassName)
              }
              ref={n => {
                justifyDropMenu(
                  n,
                  n?.parentElement?.querySelector('.dropDownButton'),
                  direction,
                );
              }}
            >
              {adder && (
                <div className={subMenuItemContainer(false, false)}>
                  {adder}
                </div>
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
                        subMenuItemContainer(isSelected, item.disabled) +
                        classNameOrEmpty(item.className)
                      }
                      style={item.style}
                    >
                      <DropMenu
                        onSelect={(v, e) => {
                          if (!item.noCloseMenu) {
                            closeMenu();
                          }
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
                        containerClassName={expandWidth}
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
                      cx(subMenuItemContainer(isSelected, item.disabled)) +
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
