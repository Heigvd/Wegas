/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/*
Imported from Colab Tooltip
*/

import { css, cx } from '@emotion/css';
import * as React from 'react';

const ttWidth = 200;
const ttPadding = 10;

const fullWidth = ttWidth + 2 * ttPadding;

export const br_lg = css({ borderRadius: '8px' });
export const text_regular = css({ fontWeight: 400 });
export const text_xs = css({ fontSize: '12px' });

export function overlayStyle(coord: [number, number]) {
  const x = window.innerWidth < coord[0] + fullWidth ? window.innerWidth - fullWidth - 5 : coord[0];
  return cx(
    br_lg,
    text_xs,
    text_regular,
    css({
      position: 'fixed',
      left: x,
      top: coord[1],
      padding: `${ttPadding}px`,
      border: '1px solid var(--divider-main)',
      backgroundColor: 'var(--secondary-darker)',
      color: 'var(--secondary-contrast)',
      width: `max-content`,
      minWidth: '120px',
      maxWidth: '200px',
      zIndex: 1000,
      whiteSpace: 'initial',
      textAlign: 'left',
    }),
  );
}

export interface TooltipProps {
  className?: string;
  tooltip: React.ReactNode | (() => React.ReactNode);
  children?: React.ReactNode;
  delayMs?: number;
  tooltipClassName?: string;
}

export default function Tooltip({
  className,
  children,
  tooltip,
  delayMs = 600,
  tooltipClassName,
}: TooltipProps): JSX.Element {
  const [coord, setCoord] = React.useState<[number, number] | undefined>(undefined);

  const [displayed, setDisplayed] = React.useState(false);

  const timerRef = React.useRef<number>();

  const onMoveCb = React.useMemo(() => {
    if (!displayed) {
      return (event: React.MouseEvent<HTMLSpanElement>) => {
        setCoord([event.clientX, event.clientY]);
      };
    } else {
      return undefined;
    }
  }, [displayed]);

  const onEnterCb = React.useCallback(() => {
    if (timerRef.current == null) {
      timerRef.current = window.setTimeout(() => {
        setDisplayed(true);
      }, delayMs);
    }
  }, [delayMs]);

  const onLeaveCb = React.useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setCoord(undefined);
    setDisplayed(false);
  }, []);

  return (
    <span
      className={className}
      onMouseLeave={onLeaveCb}
      onMouseEnter={onEnterCb}
      onMouseMove={onMoveCb}
    >
      {children}
      {coord && displayed && (
        <div className={cx(overlayStyle(coord), tooltipClassName)}>
          {tooltip instanceof Function ? tooltip() : tooltip}
        </div>
      )}
    </span>
  );
}
