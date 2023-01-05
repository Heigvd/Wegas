import React from 'react';
import classNames from 'classnames';
import { css } from '@emotion/css';

interface Props {
    icon: IconValue;
    onClick: () => void;
    label?: string;
    disabled?: boolean;
    opacity?: boolean;
    grey?: boolean;
    active?: boolean;
    iconColor?: string;
    tooltip?: string;
    className?: string;
    prefixedLabel?: boolean;
    labelClassName?: string;
}
const shapeStyle = css({
    width: 'auto',
    margin: '3px',
    // minWidth: '16px',
    // height: '16px',
    textAlign: 'center',
    display: 'inline-block',
    cursor: 'pointer',
    color: 'gray',
    ':hover': {
        color: 'black',
    },
});

const labelStyle = css({
    marginLeft: '0.35em',
});

const disabledStyle = css({
    color: 'black',
    backgroundColor: 'darkslategrey',
});

const opacityStyle = css({
    opacity: 0,
});
const activeStyle = css({ textShadow: '0 0 4px' });
const grayStyle = css({
    color: 'darkslategray',
    fontWeight: 'bold',
    fontSize: '15px',
});

function renderLabel(label?: string, labelClassName?: string) {
    if (label) {
        return (
            <span className={labelClassName ? labelClassName : labelStyle.toString()}>{label}</span>
        );
    }
    return null;
}

type IconValue = string | IconArray;

interface IconArray extends Array<IconValue> {}

function renderIcon(icon: IconValue, key?: any) {
    if (Array.isArray(icon)) {
        return (
            <span className={`fa-stack ${css({ lineHeight: 'inherit !important' })}`}>
                {icon.map((item, index) => {
                    return renderIcon(item, index);
                })}
            </span>
        );
    } else if (typeof icon === 'string') {
        return <span key={key} className={classNames(icon)} />;
    }
}

function IconButton({
    icon,
    onClick,
    grey,
    disabled,
    tooltip,
    opacity,
    active,
    className,
    label,
    prefixedLabel,
    labelClassName,
}: Props) {
    return (
        <span
            onClick={onClick}
            className={classNames(className, `${shapeStyle}`, {
                [`${disabledStyle}`]: disabled,
                [`${opacityStyle}`]: opacity,
                [`${grayStyle}`]: grey,
                [`${activeStyle}`]: active,
            })}
            title={tooltip}
        >
            {label && prefixedLabel === true ? renderLabel(label, labelClassName) : ''}
            {renderIcon(icon)}
            {label && !prefixedLabel ? renderLabel(label, labelClassName) : ''}
        </span>
    );
}

export default IconButton;
