import { css, cx, keyframes } from '@emotion/css';
import * as React from 'react';
import Picto from './Theme/Picto';
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

const pulseKeyframes = keyframes`
  0% {
    transform: translate(-93px, 47px);
  }
  30% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(360deg);
  }
  70% {
    transform: rotate(720deg);
  }
  100% {
    transform: translate(-93px, 47px);
  }
`;
const pulseEase = css`
  animation: ${pulseKeyframes} 2s ease infinite;
  transform-origin: 435px 70px;
`;
const loadingStyle = css({
  width: '100%',
  overflow: 'visible',
});
const animatedStyle = cx(
  loadingStyle,
  css({
    '& g': pulseEase,
  }),
);

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

function tumbleLoaderStyle(containerSize: number) {
  const size = Math.min(containerSize, 200);
  return css({
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    width: size,
    maxWidth: '200px',
    margin: 'auto',
  });
}
interface TumblerLoaderProps {
  size?: number;
}

export function TumbleLoader({
  size,
}: TumblerLoaderProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [computedSize, setComputedSize] = React.useState(5);

  React.useEffect(() => {
    const parentBox = container.current?.parentElement?.getBoundingClientRect();
    if (parentBox) {
      setComputedSize(Math.min(parentBox.height - 25, parentBox.width - 25));
    }
  }, []);
  return (
    <div ref={container} className={tumbleLoaderStyle(size == null ? computedSize : size)}>
      <Picto className={animatedStyle} />
    </div>
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
