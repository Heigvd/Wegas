/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { buttonStyle, inactiveButtonStyle } from '../styling/style';
import Clickable from './Clickable';
import IconButton from './IconButton';

export interface ButtonProps {
  onClick?: () => Promise<unknown>;
  label: string;
  className?: string;
  disabledClassName?: string;
  delay?: number;
  confirmMessage?: React.ReactNode;
}

const invisible = css({
  visibility: 'hidden',
});

export const loadingIconStyle = css({
  position: 'absolute',
  left: 'calc(50% - 16px)',
});

const relativeButtonStyle = cx(
  buttonStyle,
  css({
    position: 'relative',
  }),
);

export default function Button({
  onClick,
  label,
  className,
  disabledClassName,
  delay = 1000,
}: ButtonProps): JSX.Element {
  const [state, setState] = React.useState<'IDLE' | 'PENDING' | 'DONE'>('IDLE');

  const onClickCb = React.useCallback(() => {
    if (onClick) {
      setState('PENDING');
      onClick().then(() => {
        setState('IDLE');
      });
    }
  }, [onClick]);

  React.useEffect(() => {
    let tId: number | undefined;
    if (state === 'DONE') {
      //setState('FADING_OUT');
      //      tId = window.setTimeout(() => {
      setState('IDLE');
      //      }, delay);
    }
    return () => {
      if (tId != null) {
        window.clearTimeout(tId);
      }
    };
  }, [state, delay]);

  if (state === 'IDLE') {
    return (
      <Clickable
        onClick={onClick ? onClickCb : undefined}
        title={label}
        className={cx(inactiveButtonStyle, disabledClassName)}
        clickableClassName={cx(buttonStyle, className)}
      >
        <span>{label}</span>
      </Clickable>
    );
  } else if (state === 'PENDING') {
    return (
      <Clickable title={label} className={cx(relativeButtonStyle, className)}>
        <span className={invisible}>{label}</span>
        <IconButton className={cx(loadingIconStyle)} icon={faSpinner} pulse />
      </Clickable>
    );
  } else {
    return (
      <Clickable title={label} className={cx(relativeButtonStyle, className)}>
        <span className={invisible}>{label}</span>
        <IconButton className={cx(loadingIconStyle, className)} icon={faCheck} />
      </Clickable>
    );
  }
}
