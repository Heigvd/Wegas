import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { css } from 'glamor';

const shapeStyle = css({
    width: 'auto',
    minWidth: '16px',
    height: '16px',
    textAlign: 'center',
    display: 'inline-block',
    cursor: 'pointer',
    color: 'gray',
    ':hover' : {
        color: 'black'
    }
});

const labelStyle = css({
    marginLeft: '0.35em'
});


const disabledStyle = css({
    color: 'black',
    backgroundColor: 'darkslategrey'
});

const opacityStyle = css({
    opacity: 0
});

const grayStyle = css({
    color: 'darkslategray',
    fontWeight: 'bold',
    fontSize: '15px',
    backgroundColor: 'white',
    backgroundOpacity: 0,
    ':hover' : {
        backgroundOpacity: 1
    }
});


function renderLabel(label) {
    if (label) {
        return <span className={labelStyle}>{label}</span>;
    }
    return null;
}
function IconButton({
    icon,
    onClick,
    grey,
    disabled,
    iconColor,
    tooltip,
    opacity,
    className,
    label
}) {
    return (
        <span
            onClick={onClick}
            className={classNames(className, `${shapeStyle}`, {
                [`${disabledStyle}`]: disabled,
                [`${opacityStyle}`]: opacity,
                [`${grayStyle}`]: grey
            })}
            title={tooltip}
        >
            <span className={classNames(icon)} />
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
    tooltip: PropTypes.string,
    className: PropTypes.string
};
export default IconButton;
