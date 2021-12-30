/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { css, cx } from '@emotion/css';
import * as React from 'react';

export interface FlexProps {
  direction?: 'row' | 'column';
  className?: string;
  onClick?: () => void;
  shrink?: number;
  grow?: number;
  overflow?: 'clip' | 'auto' | 'visible' | 'scroll' | 'unset' | 'hidden';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?:
    | 'center'
    | 'flex-start'
    | 'flex-end'
    | 'left'
    | 'right'
    | 'normal'
    | 'space-between'
    | 'space-evenly'
    | 'stretch';
  align?:
    | 'center'
    | 'stretch'
    | 'flex-start'
    | 'flex-end'
    | 'self-start'
    | 'self-end'
    | 'normal'
    | 'first'
    | 'first baseline'
    | 'last baseline';
  children: React.ReactNode;
}

export default function Flex({
  children,
  onClick,
  overflow,
  className,
  wrap,
  shrink,
  grow,
  direction = 'row',
  justify = 'normal',
  align = 'normal',
}: FlexProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={cx(
        css({
          display: 'flex',
          flexDirection: direction,
          [direction === 'column' ? 'overflowY' : 'overflowX']: overflow,
          justifyContent: justify,
          alignItems: align,
          flexShrink: shrink,
          flexGrow: grow,
          flexWrap: wrap,
        }),
        className,
      )}
    >
      {children}
    </div>
  );
}
