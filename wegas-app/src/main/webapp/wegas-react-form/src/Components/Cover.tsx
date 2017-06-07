import React from 'react';
import { css } from 'glamor';

const absolute = css({ position: 'absolute', zIndex: 1 })

const coverStyle = css({
    position: 'fixed',
    backgroundColor: 'rgba(0,0,0,0.3)'
});

interface Props {
    children: React.ReactChild;
    zIndex?: number;
    onClick?: () => void
}

export function Cover(props: Props) {
    let top=0,
        left=0;
    const forms = document.getElementsByClassName('wegas-react-form-content');
    if (forms.length !== 0) {
        const rect = forms[0].getBoundingClientRect();
        top = rect.top;
        left = rect.left - 5; // Hack to suppress left margin
    }
    // NB: The cover will not be dynamically readjusted if the frame is resized when the cover is displayed.
    const coverFinalStyle = css(
        coverStyle, {
        top: top,
        left: left,
        right: 0,
        bottom: 0
    });
    return (
        <div {...css({ position: 'relative', zIndex: props.zIndex }) }>
            <div {...coverFinalStyle} onClick={props.onClick} />
            <div {...absolute}>
                {props.children}
            </div>
        </div>);
}
