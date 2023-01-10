import * as React from 'react';
import { css, keyframes } from '@emotion/css';

const scale = keyframes({
    '0%': {
        transform: 'scale(0)',
        opacity: 1,
    },
    '100%': {
        transform: 'scale(1)',
        opacity: 0,
    },
});
const loaderStyle = css({
    width: '30px',
    height: '30px',
    backgroundColor: '#808080',
    borderRadius: '50%',
    margin: 'auto',
    animation: `${scale} 1s infinite ease-in-out`,
});
export const SimpleLoader = () => <div className={loaderStyle} />;
