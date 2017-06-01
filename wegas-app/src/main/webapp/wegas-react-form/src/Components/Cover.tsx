import React from 'react';
import { css } from 'glamor';

const coverStyle = css({
    position: 'fixed',
    backgroundColor: 'rgba(0,0,0,0.5)',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
})
const absolute = css({ position: 'absolute', zIndex: 1 })
interface Props {
    children: React.ReactChild;
    zIndex?: number;
    onClick?: () => void
}

export function Cover(props: Props) {
    return (
        <div {...css({ position: 'relative', zIndex: props.zIndex }) }>
            <div {...coverStyle} onClick={props.onClick} />
            <div {...absolute}>
                {props.children}
            </div>
        </div>);
}