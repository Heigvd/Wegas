import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from '../css/iconButton.css';

function renderLabel(label) {
    if (label) {
        return <span className={styles.label}>{label}</span>
    }
    return null;
}
function IconButton({ icon, onClick, grey, disabled, iconColor, tooltip, opacity, className, label }) {
    return (
        <span
            onClick={onClick}
            className={classNames(className, styles.shape, {
                [styles.disabled]: disabled,
                [styles.opacity]: opacity,
                [styles.right]: label,
                [styles.grey]: grey
            })}
        >
            <span
                className={classNames(icon)}
            />
            {renderLabel(label)}
        </span>
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
