import React, { PropTypes } from 'react';
import classNames from 'classnames';
import styles from '../css/iconButton.css';

function IconButton({ icon, onClick, disabled, iconColor, tooltip }) {
    return (
        <span
            className={classNames(icon, styles.shape, {
                [styles.disabled]: disabled
            })}
            style={{ backgroundColor: iconColor }}
            onClick={onClick}
            title={tooltip}
        />
    );
}

IconButton.propTypes = {
    icon: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    iconColor: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired
};
export default IconButton;
