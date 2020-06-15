import * as React from 'react';
import Downshift, { StateChangeOptions } from 'downshift';
import { css, cx } from 'emotion';
import { IconButton } from './Inputs/Buttons/IconButton';
import { withDefault } from '../Editor/Components/Views/FontAwesome';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { Item } from '../Editor/Components/Tree/TreeSelect';
import { themeVar } from './Style/ThemeVars';
import { classNameOrEmpty } from '../Helper/className';
import { ConfirmButton } from './Inputs/Buttons/ConfirmButton';
import { flexRow, flex, itemCenter } from '../css/classes';
import { lastKeyboardEvents } from '../Helper/keyboardEvents';

export interface MenuItem<T> extends Item<T> {
  disabled?: true;
  items?: MenuItem<T>[];
}

export type SelectedMenuItem<T, MItem extends MenuItem<T>> = MItem & {
  path: number[];
  value: Exclude<MItem['value'], undefined>;
};

export interface MenuProps<T, MItem extends MenuItem<T>> {
  id?: string;
  onSelect: (
    item: SelectedMenuItem<T, MItem>,
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
  display: 'inline-block',
  padding: '5px',
  zIndex: 1,
  whiteSpace: 'nowrap',
  margin: '2px',
  boxShadow: `0px 0px 4px 1px ${themeVar.Common.colors.BorderColor}`,
  '>div': {
    padding: '1px',
    borderRadius: '3px',
  },
  '>div:hover': {
    backgroundColor: themeVar.Common.colors.HoverColor,
    color: themeVar.Common.colors.HoverTextColor,
  },
  [`& .${containerStyle}`]: {
    width: '100%',
  },
});
const DIR = {
  right: css(subMenuContainer, { left: '100%', top: 0 }),
  left: css(subMenuContainer, { right: '100%', top: 0 }),
  down: css(subMenuContainer),
  top: css(subMenuContainer, { top: '100%' }),
};
function stopPropagation(ev: React.MouseEvent<HTMLElement>) {
  ev.stopPropagation();
}

export function Menu<T, MItem extends MenuItem<T>>({
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
}: MenuProps<T, MItem>) {
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
        >
          <div className={itemStyle} onClick={() => toggleMenu()}>
            <IconButton
              label={label}
              prefixedLabel
              icon={withDefault(icon, `caret-${realDirection}` as IconName)}
              onClick={ev => {
                ev.stopPropagation();
                toggleMenu();
              }}
              className={buttonClassName}
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
                    width,
                    height,
                  } = n.getBoundingClientRect();
                  const { innerWidth, innerHeight } = window;
                  const {
                    width: pWidth,
                    height: pHeight,
                  } = n.parentElement!.getBoundingClientRect();
                  let finalLeft = left;
                  let finalTop = top;

                  // Out of window check (right and bottom)
                  if (left + width > innerWidth) {
                    finalLeft -= pWidth + width;
                  }
                  if (top + height > innerHeight) {
                    finalTop -= pHeight + height;
                  }

                  n.style.setProperty('left', `${finalLeft}px`);
                  n.style.setProperty('top', `${finalTop}px`);
                  n.style.setProperty('position', 'fixed');
                }
              }}
            >
              {adder}
              {items.map((item: MItem, index: number) => {
                const newPath = [...(path ? path : []), index];
                const trasher =
                  deleter && (!deleter.filter || deleter.filter(item)) ? (
                    <ConfirmButton
                      icon="trash"
                      onAction={() => deleter.onDelete(item)}
                    />
                  ) : null;
                const itemClassName =
                  cx(flex, flexRow, itemCenter) +
                  classNameOrEmpty(item.className);
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
                      className={itemClassName}
                      style={item.style}
                    >
                      <Menu
                        onSelect={(v, e) => {
                          closeMenu();
                          onSelect(
                            v as Parameters<MenuProps<T, MItem>['onSelect']>[0],
                            e,
                          );
                        }}
                        items={item.items}
                        direction="right"
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
                    className={itemClassName}
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
