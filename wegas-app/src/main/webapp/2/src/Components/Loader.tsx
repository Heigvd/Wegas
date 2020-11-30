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
      animation: `${tumbleLoaderAnimation} 1.2s linear infinite`,
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
