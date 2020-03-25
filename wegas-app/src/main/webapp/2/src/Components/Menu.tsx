import * as React from 'react';
import Downshift, { StateChangeOptions } from 'downshift';
import { css, cx } from 'emotion';
import { IconButton } from './Inputs/Buttons/IconButton';
import { withDefault } from '../Editor/Components/Views/FontAwesome';
import { useKeyboard } from './Hooks/useKeyboard';
import { themeVar } from './Theme';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { Item } from '../Editor/Components/Tree/TreeSelect';

export interface MenuItem<T> extends Item<T> {
  disabled?: true;
}

export interface SelectedMenuItem<T> extends MenuItem<T> {
  path: number[];
}

export interface MenuProps<I, T extends MenuItem<I> = MenuItem<I>> {
  id?: string;
  onSelect: (
    item: T & SelectedMenuItem<I>,
    keyEvent: ModifierKeysEvent,
  ) => void;
  onOpen?: () => void;
  items: readonly T[];
  label?: React.ReactNode;
  path?: number[];
  icon?: IconName;
  direction?: 'left' | 'down' | 'right' | 'top';
  containerClassName?: string;
  buttonClassName?: string;
  listClassName?: string;
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
const container = css({
  display: 'inline-block',
  position: 'relative',
});
const subMenuContainer = css({
  color: themeVar.primaryColor,
  position: 'absolute',
  display: 'inline-block',
  padding: '5px',
  zIndex: 1,
  whiteSpace: 'nowrap',
  margin: '2px',
  backgroundColor: 'rgba(255,255,255,0.95)',
  boxShadow: `0px 0px 4px 1px ${themeVar.primaryColor}`,
  [`& .${container}`]: {
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

export function Menu<I, T extends MenuItem<I> = MenuItem<I>>({
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
}: MenuProps<I, T>) {
  const realDirection = direction ? direction : 'down';
  const keyboardEvents = useKeyboard();

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
      onSelect={i => onSelect({ ...i, path: path || [] }, keyboardEvents)}
      itemToString={emtpyStr}
    >
      {({ getItemProps, isOpen, toggleMenu, closeMenu }) => (
        <div id={id} className={cx(container, containerClassName)}>
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
              className={cx(
                DIR[realDirection],
                listClassName,
                css({ background: themeVar.backgroundColor }),
              )}
              ref={n => {
                if (
                  n != null &&
                  n.style.getPropertyValue('position') !== 'fixed'
                ) {
                  const { left, top } = n.getBoundingClientRect();
                  n.style.setProperty('left', `${left}px`);
                  n.style.setProperty('top', `${top}px`);
                  n.style.setProperty('position', 'fixed');
                }
              }}
            >
              {items.map((item: T, index: number) => {
                const newPath = [...(path ? path : []), index];
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
                    >
                      <Menu
                        onSelect={(v, e) => {
                          closeMenu();
                          onSelect(v, e);
                        }}
                        items={item.items as T[]}
                        direction="right"
                        label={item.label}
                        path={newPath}
                      />
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
                  >
                    {item.label}
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
