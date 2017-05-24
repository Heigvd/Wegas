import React from 'react';
import classNames from 'classnames';
import { css } from 'glamor';

type Props = {
    icon: string;
    onClick: () => void;
    label?: string;
    disabled?: boolean;
    opacity?: boolean;
    grey?: boolean;
    iconColor?: string;
    tooltip?: string;
    className?: string;
}
const shapeStyle = css({
    width: 'auto',
    minWidth: '16px',
    height: '16px',
    textAlign: 'center',
    display: 'inline-block',
    cursor: 'pointer',
    color: 'gray',
    ':hover': {
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
    ':hover': {
        backgroundOpacity: 1
    }
});

function renderLabel(label?: string) {
    if (label) {
        return <span className={labelStyle.toString()}>{label}</span>;
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
}: Props) {
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

export default IconButton;
