/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import * as React from 'react';
import Logo from './Logo';

export interface LogoProps {
  className?: string;
}

export default ({ className }: LogoProps): JSX.Element => {
  return (
    <Logo
      className={cx(
        css({
          '& path': {
            fill: 'var(--fgColor)',
          },
        }),
        className,
      )}
    />
  );
};
