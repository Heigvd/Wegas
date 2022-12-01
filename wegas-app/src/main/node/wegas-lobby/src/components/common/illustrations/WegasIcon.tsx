/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import * as React from 'react';
import './wif.css';

export type WegasIconType =
  | 'archive'
  | 'group'
  | 'less'
  | 'list'
  | 'logout'
  | 'more'
  | 'play'
  | 'settings'
  | 'trash'
  | 'user'
  | 'trainer';

const iconChar: Record<WegasIconType, string> = {
  archive: '"a"',
  group: '"c"',
  less: '"e"',
  list: '"f"',
  logout: '"g"',
  more: '"h"',
  play: '"i"',
  settings: '"j"',
  trash: '"k"',
  user: '"l"',
  trainer: '"m"',
};

export interface WegasIconProps {
  className?: string;
  icon: WegasIconType;
  color: string;
  size: string;
}

export default function WegasIcon({ className, size, color, icon }: WegasIconProps): JSX.Element {
  return (
    <span
      className={cx(
        css({
          fontFamily: 'wegas-icon-font',
          fontSize: size,
          color: color,
          ':before': {
            textTransform: 'none',
            verticalAlign: 'bottom',
            content: iconChar[icon],
          },
        }),
        className,
      )}
    ></span>
  );
}
