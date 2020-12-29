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

const tumbleLoaderAnimation = keyframes({
  '0% ': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(360deg)',
  },
});

function tumbleLoaderStyle(size: number, color: string = '#fff') {
  const sideSize = (size * 6) / 8 + 'px';
  const margin = size / 8 + 'px';
  const border = (size / 32) * 3 + 'px';
  return css({
    display: 'inline-block',
    width: sideSize,
    height: sideSize,
    margin: margin,
    '&:after': {
      content: '""',
      display: 'block',
      width: sideSize,
      height: sideSize,
      // margin: margin,
      borderRadius: '50%',
      border: `${border} solid ${color}`,
      borderColor: `${color} transparent ${color} transparent`,
      animation: `${tumbleLoaderAnimation} 1.2s steps(16) infinite`,
    },
  });
}
interface TumblerLoaderProps {
  color?: string;
  size?: number;
}

export function TumbleLoader({
  color = themeVar.Common.colors.ActiveColor,
  size,
}: TumblerLoaderProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [computedSize, setComputedSize] = React.useState(5);

  React.useEffect(() => {
    const parentBox = container.current?.parentElement?.getBoundingClientRect();
    if (parentBox) {
      setComputedSize(Math.min(parentBox.height, parentBox.width));
    }
  }, []);

  return (
    <div
      ref={container}
      className={tumbleLoaderStyle(size == null ? computedSize : size, color)}
    />
  );
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
  color = themeVar.Common.colors.ActiveColor,
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
