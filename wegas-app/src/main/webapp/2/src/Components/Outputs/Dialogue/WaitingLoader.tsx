import { css, cx } from 'emotion';
import * as React from 'react';
import { flex, itemCenter, justifyCenter } from '../../../css/classes';
import { DotLoader } from '../../Loader';
import { themeVar } from '../../Style/ThemeVars';

const loaderStyle = (
  background: string | undefined = themeVar.Common.colors.BackgroundColor,
) =>
  css({
    position: 'absolute',
    background: background,
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  });

interface WaitingLoaderProps {
  color?: string;
  background?: string;
}

export function WaitingLoader({ color, background }: WaitingLoaderProps) {
  return (
    <div
      className={cx(flex, itemCenter, justifyCenter, loaderStyle(background))}
    >
      <DotLoader color={color} />
    </div>
  );
}
