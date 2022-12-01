import * as React from 'react';
import { css } from 'glamor';

const container = css({
    display: 'block',
    position: 'relative',
    '& > .submenu': {
        display: 'none',
    },
    '&:hover > .submenu': {
        display: 'block',
    },
});
const subMenuContainer = css({
    position: 'absolute',
    display: 'inline-block',
    padding: '5px',
    zIndex: 1,
    whiteSpace: 'nowrap',
    margin: '2px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    boxShadow: '0px 0px 1px 0px black',
    [`& .${container}`]: {
        width: '100%',
    },
});
const itemStyle = css({
    cursor: 'pointer',
    display: 'block',
    background: 'none',
    padding: '5px',
    border: 'none',
    width: '100%',
    ':hover': {
        backgroundColor: 'whitesmoke',
        /*textShadow: '0 0 1px',*/
    },
    '& > span': {
        marginLeft: '0.5em',
    },
});
const DIR = {
    right: css(subMenuContainer, { left: '100%', top: 0 }),
    left: css(subMenuContainer, { right: '100%', top: 0 }),
    down: css(subMenuContainer),
    top: css(subMenuContainer, { top: '100%' }),
};
interface MenuProps<T extends { value?: {}; children?: T[] }> {
    onChange: (item: T) => void;
    /**
     * default "down"
     */
    direction?: 'right' | 'down' | 'left' | 'top';
    menu: T[];
    /**
     * @private internal usage
     */
    _submenu?: boolean;
}
export default function Menu<
    T extends { label: string; className?: string; value?: {}; children?: T[] },
>({ onChange, direction = 'down', menu, _submenu = false }: MenuProps<T>): JSX.Element {
    return (
        <div
            className={`${DIR[direction]}`}
            ref={n => {
                if (!_submenu && n != null) {
                    const { top, left } = n.getBoundingClientRect();
                    n.style.setProperty('position', 'fixed');
                    n.style.setProperty('top', `${top}px`);
                    n.style.setProperty('left', `${left}px`);
                }
            }}
        >
            {menu.map((item, index) => {
                if (Array.isArray(item.children)) {
                    return (
                        <div key={index} className={`${container} ${item.className || ''}`}>
                            <button
                                key={index}
                                className={String(itemStyle)}
                                disabled={item.value === undefined}
                                onClick={e => {
                                    e.stopPropagation();
                                    onChange(item);
                                }}
                            >
                                {item.label}
                                <span style={{ float: 'right' }} className="fa fa-caret-right" />
                            </button>
                            <div className="submenu">
                                <Menu
                                    onChange={v => {
                                        onChange(v);
                                    }}
                                    menu={item.children}
                                    direction="right"
                                    _submenu
                                />
                            </div>
                        </div>
                    );
                }
                return (
                    <button
                        key={index}
                        className={`${itemStyle} ${item.className || ''}`}
                        onClick={() => onChange(item)}
                        disabled={item.value === undefined}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
