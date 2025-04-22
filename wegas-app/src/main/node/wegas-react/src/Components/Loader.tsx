import { css, cx, keyframes } from '@emotion/css';
import * as React from 'react';
import { themeVar } from './Theme/ThemeVars';

const anim = keyframes({
  '0%': {
    width: '0%',
    left: 0,
    borderBottomColor: themeVar.colors.PrimaryColor,
  },
  '50%': {
    width: '50%',
    left: '25%',
    borderBottomColor: themeVar.colors.PrimaryColor,
  },
  '100%': {
    width: '0%',
    left: '100%',
    borderBottomColor: themeVar.colors.PrimaryColor,
  },
});

const textLoaderStyle = css({
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
  return <span className={textLoaderStyle}>{text}</span>;
}

const animationMoves = keyframes`
  0%,
  100% { box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 1), 2em 0em 0 0 rgba(0, 0, 0, 0), 0em 2em 0 0 rgba(0, 0, 0, 0), -2em 0em 0 0 rgba(0, 0, 0, 0);}
  20% {  box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 1), 2em 0em 0 0 rgba(0, 0, 0, 1), 0em 2em 0 0 rgba(0, 0, 0, 0), -2em 0em 0 0 rgba(0, 0, 0, 0); }
  40% {  box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 0), 2em 0em 0 0 rgba(0, 0, 0, 1), 0em 2em 0 0 rgba(0, 0, 0, 1), -2em 0em 0 0 rgba(0, 0, 0, 0); }
  60% {  box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 0), 2em 0em 0 0 rgba(0, 0, 0, 0), 0em 2em 0 0 rgba(0, 0, 0, 1), -2em 0em 0 0 rgba(0, 0, 0, 1); }
  80% {  box-shadow: 0em -2em 0 0 rgba(0, 0, 0, 1), 2em 0em 0 0 rgba(0, 0, 0, 0), 0em 2em 0 0 rgba(0, 0, 0, 0), -2em 0em 0 0 rgba(0, 0, 0, 1); }`;

const tumbleLoaderStyle = css({
  color: '#000000',
  fontSize: '10px',
  margin: '2em 2em',
  position: 'relative',
  textIndent: '-9999em',
  transform: 'translateZ(0)',
  width: '2em',
  height: '2em',
  animationFillMode: 'both',
  animation: `${animationMoves} 3.5s infinite ease-in-out`,
});

export function TumbleLoader() {
  const container = React.useRef<HTMLDivElement>(null);
  return <div ref={container} className={cx(tumbleLoaderStyle, 'wegas-loader-tumble')}></div>;
}

const dotLoaderAnimation1 = keyframes({
  '0%': {
    transform: 'scale(0)',
  },
  '100%': {
    transform: 'scale(1)',
  },
});

const dotLoaderAnimation2 = keyframes({
  '0%': {
    transform: 'translate(0, 0)',
  },
  '100%': {
    transform: 'translate(24px, 0)',
  },
});

const dotLoaderAnimation3 = keyframes({
  '0%': {
    transform: ' scale(1)',
  },
  '100%': {
    transform: 'scale(0)',
  },
});

const dotLoaderStyle = (color?: string) =>
  css({
    display: 'inline-block',
    position: 'relative',
    width: '80px',
    height: '80px',
    '& div': {
      position: 'absolute',
      top: '33px',
      width: '13px',
      height: '13px',
      borderRadius: '50%',
      background: color,
      animationTimingFunction: 'cubic-bezier(0, 1, 1, 0)',
    },
    '& div:nth-child(1)': {
      left: '8px',
      animation: `${dotLoaderAnimation1} 0.6s infinite`,
    },
    '& div:nth-child(2)': {
      left: '8px',
      animation: `${dotLoaderAnimation2} 0.6s infinite`,
    },
    '& div:nth-child(3)': {
      left: '32px',
      animation: `${dotLoaderAnimation2} 0.6s infinite`,
    },
    '& div:nth-child(4)': {
      left: '56px',
      animation: `${dotLoaderAnimation3} 0.6s infinite`,
    },
  });

interface DotLoaderProps {
  color?: string;
}

export function DotLoader({
  color = themeVar.colors.ActiveColor,
}: DotLoaderProps) {
  return (
    <div className={dotLoaderStyle(color)}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

const customDotLoaderStyle = (size: number = 80, color?: string) =>
  css({
    display: 'inline-block',
    position: 'relative',
    width: `${size}px`,
    height: `${size}px`,
    '& div': {
      position: 'absolute',
      top: `${(33 / 80) * size}px`,
      width: `${(13 / 80) * size}px`,
      height: `${(13 / 80) * size}px`,
      borderRadius: '50%',
      background: color,
      animationTimingFunction: 'cubic-bezier(0, 1, 1, 0)',
    },
    '& div:nth-child(1)': {
      left: `${(8 / 80) * size}px`,
      animation: `${dotLoaderAnimation1} 0.6s infinite`,
    },
    '& div:nth-child(2)': {
      left: `${(8 / 80) * size}px`,
      animation: `${dotLoaderAnimation2} 0.6s infinite`,
    },
    '& div:nth-child(3)': {
      left: `${(32 / 80) * size}px`,
      animation: `${dotLoaderAnimation2} 0.6s infinite`,
    },
    '& div:nth-child(4)': {
      left: `${(56 / 80) * size}px`,
      animation: `${dotLoaderAnimation3} 0.6s infinite`,
    },
  });

interface CustomDotLoaderProps extends DotLoaderProps {
  size?: number;
}

export function CustomDotLoader({
  color = themeVar.colors.ActiveColor,
  size,
}: CustomDotLoaderProps) {
  return (
    <div className={customDotLoaderStyle(size, color)}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
