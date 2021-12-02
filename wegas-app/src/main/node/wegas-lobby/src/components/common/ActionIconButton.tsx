/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { FlipProp, IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { ConfirmIconButton } from '../common/ConfirmIconButton';
import IconButton from '../common/IconButton';

export interface ActionIconButton {
  onClick: () => Promise<unknown>;
  title: string;
  className?: string;
  icon: IconProp;
  flip?: FlipProp;
  children?: React.ReactNode;
  shouldConfirm?: boolean | 'HARD' | 'SOFT_LEFT' | 'SOFT_CENTER' | 'SOFT_RIGHT';
  delay?: number;
  confirmMessage?: React.ReactNode;
}

export default function ActionIconButton({
  shouldConfirm = false,
  className,
  icon = faPlay,
  flip,
  onClick,
  children,
  delay = 1500,
  title,
  confirmMessage,
}: ActionIconButton): JSX.Element {
  const [state, setState] = React.useState<'IDLE' | 'PENDING' | 'DONE'>('IDLE');

  const onClickCb = React.useCallback(() => {
    setState('PENDING');
    onClick().then(() => {
      setState('DONE');
    });
  }, [onClick]);

  const winConfirmCb = React.useCallback(() => {
    // eslint-disable-next-line no-alert
    const result = window.confirm(`${title}?`);
    if (result) {
      onClickCb();
    }
  }, [onClickCb, title]);

  React.useEffect(() => {
    let tId: number | undefined;
    if (state === 'DONE') {
      //setState('FADING_OUT');
      tId = window.setTimeout(() => {
        setState('IDLE');
      }, delay);
    }
    return () => {
      if (tId != null) {
        window.clearTimeout(tId);
      }
    };
  }, [state, delay]);

  if (state === 'IDLE') {
    if (shouldConfirm === true || shouldConfirm === 'SOFT_CENTER') {
      return (
        <ConfirmIconButton
          position={'CENTER'}
          icon={icon}
          flip={flip}
          onConfirm={onClickCb}
          title={title}
        >
          {children}
        </ConfirmIconButton>
      );
    } else if (shouldConfirm === 'SOFT_LEFT') {
      return (
        <ConfirmIconButton
          position={'LEFT'}
          icon={icon}
          flip={flip}
          onConfirm={onClickCb}
          title={title}
        >
          {children}
        </ConfirmIconButton>
      );
    } else if (shouldConfirm === 'SOFT_RIGHT') {
      return (
        <ConfirmIconButton
          position={'RIGHT'}
          icon={icon}
          flip={flip}
          onConfirm={onClickCb}
          title={title}
        >
          {children}
        </ConfirmIconButton>
      );
    } else if (shouldConfirm === 'HARD') {
      return (
        <IconButton
          className={className}
          icon={icon}
          flip={flip}
          onClick={winConfirmCb}
          title={title}
        >
          {children}
        </IconButton>
      );
    } else {
      return (
        <IconButton className={className} icon={icon} flip={flip} onClick={onClickCb} title={title}>
          {children}
        </IconButton>
      );
    }
  } else if (state === 'PENDING') {
    return <IconButton className={className} icon={faSpinner} pulse />;
  } else {
    return (
      <IconButton className={className} icon={faCheck}>
        {confirmMessage}
      </IconButton>
    );
  }
}
