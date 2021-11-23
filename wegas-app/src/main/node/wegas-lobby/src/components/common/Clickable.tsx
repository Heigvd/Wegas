/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { linkStyle } from '../styling/style';

export interface ClickablenProps {
  onClick?: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  clickableClassName?: string;
}

export default function Clickable({
  onClick,
  title,
  children,
  className,
  clickableClassName = linkStyle,
}: ClickablenProps): JSX.Element {
  /**
   * Pressing enter or space simulates click
   */
  const keyDownCb = React.useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (onClick != null) {
        if (event.code === 'Space' || event.key === 'Enter') {
          onClick();
          event.stopPropagation();
        }
      }
    },
    [onClick],
  );

  const onClickCb = React.useCallback(() => {
    if (onClick != null) {
      onClick();
    }
  }, [onClick]);

  return (
    <span
      tabIndex={onClick != null ? 0 : -1}
      className={onClick != null ? clickableClassName : className}
      onClick={onClickCb}
      onKeyDown={keyDownCb}
      title={title}
    >
      {children}
    </span>
  );
}
