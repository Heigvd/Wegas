import * as React from 'react';
import Downshift, { StateChangeOptions } from 'downshift';
import { css, cx } from 'emotion';
import { withDefault } from '../Editor/Components/Views/FontAwesome';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { Item } from '../Editor/Components/Tree/TreeSelect';
import { themeVar } from './Style/ThemeVars';
import { classNameOrEmpty } from '../Helper/className';
import { ConfirmButton } from './Inputs/Buttons/ConfirmButton';
import { flexRow, flex, itemCenter } from '../css/classes';
import { lastKeyboardEvents } from '../Helper/keyboardEvents';
import { Button } from './Inputs/Buttons/Button';

export interface DropMenuItem<T> extends Item<T> {
  disabled?: true;
  items?: DropMenuItem<T>[];
}

export type SelecteDropdMenuItem<
  T,
  MItem extends DropMenuItem<T> = DropMenuItem<T>
> = MItem & {
  path: number[];
  value: Exclude<MItem['value'], undefined>;
};

export interface DropMenuProps<
  T,
  MItem extends DropMenuItem<T> = DropMenuItem<T>
> {
  id?: string;
  onSelect: (
    item: SelecteDropdMenuItem<T, MItem>,
    keyEvent: ModifierKeysEvent,
  ) => void;
  onOpen?: () => void;
  items: readonly MItem[];
  label?: React.ReactNode;
  path?: number[];
  icon?: IconName;
  direction?: 'left' | 'down' | 'right' | 'top';
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
  color: themeVar.Common.colors.TextColor,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  position: 'absolute',
  zIndex: 10000,
  whiteSpace: 'nowrap',
  margin: '2px',
  boxShadow: `0px 0px 4px 1px ${themeVar.Common.colors.PrimaryColor}`,
  '>div': {
    padding: '1px',
    borderRadius: '3px',
  },
  [`& .${containerStyle}`]: {
    width: '100%',
  },
});
const subMenuItemContainer = cx(
  flex,
  flexRow,
  itemCenter,
  css({
    marginLeft: '5px',
    marginRight: '5px',
    ':hover': {
      backgroundColor: themeVar.Common.colors.HoverColor,
      color: themeVar.Common.colors.HoverTextColor,
    },
  }),
);

const DIR = {
  right: css(subMenuContainer, { left: '100%', top: 0 }),
  left: css(subMenuContainer, { right: '100%', top: 0 }),
  down: css(subMenuContainer),
  top: css(subMenuContainer, { top: '100%' }),
};
function stopPropagation(ev: React.MouseEvent<HTMLElement>) {
  ev.stopPropagation();
}

export function DropMenu<T, MItem extends DropMenuItem<T>>({
  id,
  onOpen,
  onSelect,
  direction,
  label,
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
}: DropMenuProps<T, MItem>) {
  const realDirection = direction ? direction : 'down';
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
      onSelect={(i: MItem) =>
        i.value != null &&
        onSelect(
          {
            ...i,
            value: i.value as Exclude<MItem['value'], undefined>,
            path: path || [],
          },
          lastKeyboardEvents,
        )
      }
      itemToString={emtpyStr}
    >
      {({ getItemProps, isOpen, toggleMenu, closeMenu }) => (
        <div
          id={id}
          className={containerStyle + classNameOrEmpty(containerClassName)}
          style={style}
        >
          <div className={itemStyle} onClick={() => toggleMenu()}>
            <Button
              label={label}
              prefixedLabel
              icon={withDefault(
                icon,
                !adder && items.length === 0
                  ? { icon: 'circle', size: 'sm' }
                  : { icon: `caret-${realDirection}` as IconName },
                // : (`caret-${realDirection}` as IconName)) as Icon,
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
              className={DIR[realDirection] + classNameOrEmpty(listClassName)}
              ref={n => {
                if (
                  n != null &&
                  n.style.getPropertyValue('position') !== 'fixed'
                ) {
                  const {
                    left,
                    top,
                    width: preWidth,
                    height: preHeight,
                  } = n.getBoundingClientRect();
                  const { innerWidth, innerHeight } = window;
                  const {
                    width: pWidth,
                    height: pHeight,
                    top: pTop,
                    left: pLeft,
                    bottom: pBottom,
                    right: pRight,
                  } = n.parentElement!.getBoundingClientRect();

                  const allowedWitdh =
                    realDirection === 'down' || realDirection === 'top'
                      ? innerWidth
                      : realDirection === 'left'
                      ? pLeft
                      : innerWidth - pLeft - pWidth;
                  const allowedHeight =
                    realDirection === 'left' || realDirection === 'right'
                      ? innerHeight
                      : realDirection === 'top'
                      ? pTop
                      : innerHeight - pTop - pHeight;

                  const width =
                    preWidth > allowedWitdh
                      ? allowedWitdh
                      : preWidth < pWidth
                      ? pWidth
                      : preWidth;

                  const height =
                    preHeight > allowedHeight ? allowedHeight : preHeight;

                  let finalTop = top;
                  let finalLeft = left;

                  if (left + width > allowedWitdh) {
                    finalLeft -= left + width - allowedWitdh;
                  }
                  if (top + height > allowedHeight) {
                    finalTop -= top + height - allowedHeight;
                  }

                  // Out of window check (right and bottom)
                  switch (realDirection) {
                    case 'top':
                      n.style.setProperty('top', `${pTop}px`);
                      n.style.setProperty('left', `${finalLeft}px`);
                      break;
                    case 'left':
                      n.style.setProperty('top', `${finalTop}px`);
                      n.style.setProperty('right', `${pRight}px`);
                      break;
                    case 'down':
                      n.style.setProperty('top', `${pBottom}px`);
                      n.style.setProperty('left', `${finalLeft}px`);
                      break;
                    case 'right':
                      n.style.setProperty('top', `${finalTop}px`);
                      n.style.setProperty('left', `${pLeft}px`);
                      break;
                  }

                  n.style.setProperty('overflow', 'auto');
                  n.style.setProperty('max-width', `${allowedWitdh}px`);
                  n.style.setProperty('max-height', `${allowedHeight}px`);
                  n.style.setProperty('position', 'fixed');
                }
              }}
            >
              {adder && <div className={subMenuItemContainer}>{adder}</div>}
              {items.map((item: MItem, index: number) => {
                const newPath = [...(path ? path : []), index];
                const trasher =
                  deleter && (!deleter.filter || deleter.filter(item)) ? (
                    <ConfirmButton
                      icon="trash"
                      onAction={() => deleter.onDelete(item)}
                    />
                  ) : null;

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
                        subMenuItemContainer + classNameOrEmpty(item.className)
                      }
                      style={item.style}
                    >
                      <DropMenu
                        onSelect={(v, e) => {
                          closeMenu();
                          onSelect(
                            v as Parameters<
                              DropMenuProps<T, MItem>['onSelect']
                            >[0],
                            e,
                          );
                        }}
                        items={item.items}
                        direction={realDirection === 'right' ? 'left' : 'right'}
                        label={item.label}
                        path={newPath}
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
                      subMenuItemContainer + classNameOrEmpty(item.className)
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
