import React, { PropTypes } from 'react';
import classNames from 'classnames';
import styles from '../css/iconButton.css';

function IconButton({ icon, onClick, grey, disabled, iconColor, tooltip, opacity, className }) {
    return (
        <span
            className={classNames(icon, className, styles.shape, {
                [styles.disabled]: disabled,
                [styles.opacity]: opacity,
                [styles.grey]: grey
            })}
            onClick={onClick}

        />
    );
}

IconButton.propTypes = {
    icon: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    opacity: PropTypes.bool,
    grey: PropTypes.bool,
    iconColor: PropTypes.string,
    tooltip: PropTypes.string.isRequired,
    className: PropTypes.string
};
export default IconButton;
