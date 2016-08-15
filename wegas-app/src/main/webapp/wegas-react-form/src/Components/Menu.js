import React, { PropTypes } from 'react';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import ArrowDropRight from 'material-ui/svg-icons/navigation-arrow-drop-right';

function genItems(callback) {
    return (o, i) => {
        const hasSubMenu = Array.isArray(o.children);
        return (
            <MenuItem
                key={i}
                primaryText={o.label}
                disabled={o.disabled}
                rightIcon={hasSubMenu ? <ArrowDropRight /> : undefined}
                onTouchTap={!hasSubMenu ? () => callback(o.value) : undefined}
                menuItems={hasSubMenu ? o.children.map(genItems(callback)) : undefined}
            />
        );
    };
}
function Menu({ menu, onChange }) {
    const menuItems = menu.map(genItems(onChange));
    return (
        <IconMenu
            iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
        >
            {menuItems}
        </IconMenu>
    );
}
Menu.propTypes = {
    menu: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired
};
export default Menu;
