import * as React from 'react';
import Downshift, { StateChangeOptions } from 'downshift';
import { css, cx } from 'emotion';
import { IconButton } from './Inputs/Buttons/IconButton';
import { withDefault } from '../Editor/Components/Views/FontAwesome';
import { useKeyboard } from './Hooks/useKeyboard';
import { themeVar } from './Theme';
import { IconName } from '@fortawesome/fontawesome-svg-core';

interface Item<T> {
  label: React.ReactNode;
  disabled?: true;
  children?: T[];
}
export interface MenuProps<T extends Item<T>> {
  onSelect: (item: T, keyEvent: ModifierKeysEvent) => void;
  onOpen?: () => void;
  items: readonly T[];
  label?: React.ReactNode;
  icon?: IconName;
  direction?: 'left' | 'down' | 'right' | 'top';
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
  position: 'absolute',
  display: 'inline-block',
  padding: '5px',
  zIndex: 1,
  whiteSpace: 'nowrap',
  margin: '2px',
  backgroundColor: 'rgba(255,255,255,0.95)',
  boxShadow: '0px 0px 4px 1px black',
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

export function Menu<T extends Item<T>>({
  onOpen,
  onSelect,
  direction,
  label,
  items,
  icon,
  buttonClassName,
  listClassName,
}: MenuProps<T>) {
  const realDirection = direction ? direction : 'down';
  const keyboardEvents = useKeyboard();

  const onStateChange = React.useCallback(
    (changes: StateChangeOptions<never>) => {
      if (changes.isOpen != null && changes.isOpen) {
        onOpen && onOpen();
      }
    },
    [onOpen],
  );

  return (
    <Downshift
      onStateChange={onStateChange}
      onSelect={i => onSelect(i, keyboardEvents)}
      itemToString={emtpyStr}
    >
      {({ getItemProps, isOpen, toggleMenu, closeMenu }) => (
        <div className={container}>
          <div className={itemStyle} onClick={() => toggleMenu()}>
            {label}
            <IconButton
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
              {items.map((item, index) => {
                if (Array.isArray(item.children)) {
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
                        items={item.children}
                        direction="right"
                        label={item.label}
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
