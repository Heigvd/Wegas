import { css, keyframes } from 'emotion';
import * as React from 'react';
import { themeVar } from './Style/ThemeVars';

const anim = keyframes({
  '0%': {
    width: '0%',
    left: 0,
    borderBottomColor: themeVar.Common.colors.BorderColor,
  },
  '50%': {
    width: '50%',
    left: '25%',
    borderBottomColor: themeVar.Common.colors.BorderColor,
  },
  '100%': {
    width: '0%',
    left: '100%',
    borderBottomColor: themeVar.Common.colors.BorderColor,
  },
});
const loaderStyle = css({
  position: 'relative',
  padding: '0 10px',
  '&:after': {
    display: 'block',
    content: '""',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    borderBottom: '2px solid',
    overflow: 'hidden',
    animation: `${anim} 3s infinite`,
  },
});
export function TextLoader({ text = 'Loading...' }: { text?: string }) {
  return <span className={loaderStyle}>{text}</span>;
}
