import { css } from '@emotion/css';
import React from 'react';

const style = css({
    paddingBottom: 5,
    width: '100%',
    position: 'relative',
});
export default function Statement(props: {
    children: React.ReactNode;
}) {
    return <div className={style.toString()}>{props.children}</div>;
}
