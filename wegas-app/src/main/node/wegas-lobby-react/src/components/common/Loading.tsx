/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx, keyframes } from '@emotion/css';
import * as React from 'react';
import Picto from '../styling/Picto';
import { fullPageStyle } from '../styling/style';

//const pulseKeyframes = keyframes`
//  0% {
//   transform: rotate(0deg);
//  }
//  33% {
//    transform: rotate(240deg);
//  }
//  66% {
//    transform: rotate(480deg);
//  }
//  100% {
//    transform: rotate(720deg);
//  }
//`;

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
  maxWidth: '200px',
  overflow: 'visible',
});

const animatedStyle = cx(
  loadingStyle,
  css({
    '& g': pulseEase,
  }),
);

export default function Loading({
  animated = true,
  children,
}: {
  animated?: boolean;
  children?: React.ReactNode;
}): JSX.Element {
  return (
    <div className={fullPageStyle}>
      <div
        className={css({
          margin: 'auto',
        })}
      >
        <Picto className={animated ? animatedStyle : loadingStyle} />
        {children}
      </div>
    </div>
  );
}

// <InlineLoading size="4x" />
