import { css, cx, keyframes } from '@emotion/css';
import * as React from 'react';
import Picto from './Theme/Picto';

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


interface MaxiLoaderProps {
  size?: number;
}

export function MaxiLoader({
  size,
}: MaxiLoaderProps) {
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
