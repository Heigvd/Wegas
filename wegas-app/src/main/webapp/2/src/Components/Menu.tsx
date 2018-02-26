import * as React from 'react';
import Downshift from 'downshift';
import { css } from 'glamor';
import { IconButton } from './Button/IconButton';
import { IconProp } from '@fortawesome/fontawesome';
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
  padding: '3px',
  backgroundColor: 'white',
  boxShadow: '1px 1px 3px black',
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
    const { onSelect, direction, label } = this.props;
    return (
      <Downshift
        onSelect={onSelect}
        itemToString={() => ''}
        render={({ getItemProps, isOpen, toggleMenu, closeMenu }) => (
          <div className={String(container)}>
            <div {...itemStyle} onClick={() => toggleMenu()}>
              {label}
              <IconButton
                icon={`caret-${direction}` as IconProp}
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
                      {...(!item.disabled ? itemStyle : undefined)}
                      {...(!item.disabled
                        ? getItemProps({
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
      />
    );
  }
}
