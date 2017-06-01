import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import Menu, { Item, SubMenu } from 'rc-menu';
// eslint-disable-next-line
import '!!style-loader!css-loader!rc-menu/assets/index.css';

const MENU_STYLE = css({ display: 'inline-block', backgroundColor: 'white' });
function genItems(o, i) {
    const hasSubMenu = Array.isArray(o.children);
    if (hasSubMenu) {
        const key = o.value || i;
        return (
            <SubMenu key={JSON.stringify(key)} title={o.label}>
                {o.children.map(genItems)}
            </SubMenu>
        );
    }
    return (
        <Item key={JSON.stringify(o.value)} disabled={o.disabled}>
            {o.label}
        </Item>
    );
}
function WMenu({ menu, onChange }) {
    const menuItems = menu.map(genItems);
    return (
        <Menu
            className={MENU_STYLE.toString()}
            onClick={value => onChange(JSON.parse(value.key))}
        >
            {menuItems}
        </Menu>
    );
}
WMenu.propTypes = {
    menu: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.any,
            disabled: PropTypes.bool,
            children: PropTypes.array
        })
    ).isRequired,
    onChange: PropTypes.func.isRequired
};
export default WMenu;
