import * as React from 'react';
import Downshift, { StateChangeOptions } from 'downshift';
import { css } from 'emotion';
import { IconButton } from './Button/IconButton';
import { Props } from '@fortawesome/react-fontawesome';

interface Item<T> {
  label: React.ReactNode;
  disabled?: true;
  children?: T[];
}
interface MenuProps<T extends Item<T>> {
  onSelect: (item: T) => void;
  onOpen?: () => void;
  items: T[];
  label?: React.ReactNode;
  icon?: Props['icon'];
  direction: 'left' | 'down' | 'right' | 'top';
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
export class Menu<T extends Item<T>> extends React.Component<MenuProps<T>> {
  static defaultProps = {
    direction: 'down',
  };
  onStateChange = (changes: StateChangeOptions<any>) => {
    if (changes.isOpen != null && changes.isOpen) {
      this.props.onOpen && this.props.onOpen();
    }
  };
  render(): JSX.Element {
    const { onSelect, direction, label, icon } = this.props;
    return (
      <Downshift
        onStateChange={this.onStateChange}
        onSelect={onSelect}
        itemToString={emtpyStr}
      >
        {({ getItemProps, isOpen, toggleMenu, closeMenu }) => (
          <div className={String(container)}>
            <div className={itemStyle} onClick={() => toggleMenu()}>
              {label}
              <IconButton
                icon={
                  icon != null ? icon : (`caret-${direction}` as Props['icon'])
                }
                onClick={ev => {
                  ev.stopPropagation();
                  toggleMenu();
                }}
              />
            </div>

            {isOpen && (
              <div
                className={DIR[direction]}
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
                {this.props.items.map((item, index) => {
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
                          onSelect={v => {
                            closeMenu();
                            onSelect(v);
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
}
