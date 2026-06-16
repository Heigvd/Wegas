/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import * as React from 'react';

const fullPageStyle = cx(
  css({
    backgroundColor: '#F9F9F9',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
);

const fullPageOverlayStyle = cx(
  fullPageStyle,
  css({
    backgroundColor: '#dfdfdfdf',
  }),
);

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

  return (
    <div
      onClick={clickOut}
      tabIndex={0}
      className={cx(
        fullPageOverlayStyle,
        css({ zIndex: 999, '& *': { overscrollBehavior: 'contain' } }),
        backgroundStyle,
      )}
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
