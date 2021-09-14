/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import * as React from 'react';
import { fullPageOverlayStyle } from '../styling/style';

interface Props {
  children: React.ReactNode;
  backgroundStyle?: string;
  clickOutside?: () => void;
}

export default function Overlay({ children, backgroundStyle, clickOutside }: Props): JSX.Element {
  const clickIn = React.useCallback((event: React.MouseEvent<HTMLDivElement> | undefined) => {
    if (event != null) {
      event.stopPropagation();
    }
  }, []);

  const clickOut = React.useCallback(() => {
    if (clickOutside) {
      clickOutside();
    }
  }, [clickOutside]);

  //  /**
  //   * Pressing escape simulate clickOutside()
  //   */
  //  const keyDownCb = React.useCallback(
  //    (event: React.KeyboardEvent<HTMLElement>) => {
  //      if (clickOutside != null) {
  //        if (event.code === 'Escape') {
  //          clickOutside();
  //        }
  //      }
  //    },
  //    [clickOutside],
  //  );

  return (
    <div
      onClick={clickOut}
      tabIndex={0}
      //      onKeyDown={keyDownCb}
      className={cx(fullPageOverlayStyle, css({ zIndex: 999 }), backgroundStyle)}
    >
      <div
        onClick={clickIn}
        className={css({
          margin: 'auto',
        })}
      >
        {children}
      </div>
    </div>
  );
}
