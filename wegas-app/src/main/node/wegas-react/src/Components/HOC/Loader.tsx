import * as React from 'react';
import { css, cx, keyframes } from '@emotion/css';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';

const loader = css({
  width: '100px',
  height: '100px',
  display: 'flex',
  justifyContent: 'center',
});

const circle = css({
  width: '80%',
  height: '80%',
  justifyContent: 'center',
});

const rotateanim = keyframes`
      0% { transform: rotate(0deg); }
      50% { transform: rotate(180deg); }
      100% { transform: rotate(360deg); }
  `;
const rotate = css({
  animation: `${rotateanim} 5s infinite linear`,
});

const gradient = css({
  background: 'linear-gradient(#eee, #333)',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
});

const svgSettings = css({
  position: 'absolute',
  height: '1px',
  width: '1px',
  overflow: 'hidden',
  clip: ['1px', '1px', '1px', '1px'],
});

const fillradial = css({
  '& path': {
    fill: 'url(#linear)',
  },
});

const radialstop1 = css({
  stopColor: '#69db7c',
});

const radialstop2 = css({
  stopColor: '#2f9e44',
});

export function Loader() {
  return (
    <>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        className={svgSettings}
      >
        <defs>
          <linearGradient id="linear">
            <stop className={radialstop1} offset="0%" />
            <stop className={radialstop2} offset="100%" />
          </linearGradient>
          <radialGradient id="radial">
            <stop className="radial-stop1" offset="0%" />
            <stop className="radial-stop2" offset="100%" />
          </radialGradient>
        </defs>
      </svg>
      <div className={loader}>
        <div className={cx(rotate, circle)}>
          <FontAwesome
            icon="cog"
            size="5x"
            color={gradient}
            className={fillradial}
          />
        </div>
      </div>
    </>
  );
}
