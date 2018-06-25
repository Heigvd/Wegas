import * as React from 'react';
import Downshift from 'downshift';
import { css } from 'emotion';
import { IconButton } from './Button/IconButton';
import { Props } from '@fortawesome/react-fontawesome';
interface KV {
  [key: string]: any;
}
interface Item extends KV {
  label: React.ReactNode;
  disabled?: true;
  children?: Item[];
}
interface MenuProps {
  onSelect: (item: Item) => void;
  items: Item[];
  label?: React.ReactNode;
  icon?: Props['icon'];
  direction?: 'left' | 'down' | 'right' | 'top';
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
export class Menu extends React.Component<MenuProps> {
  static defaultProps = {
    direction: 'down',
  };
  render(): JSX.Element {
    const { onSelect, direction, label, icon } = this.props;
    return (
      <Downshift onSelect={onSelect} itemToString={() => ''}>
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
              <div className={String(DIR[direction!])}>
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
