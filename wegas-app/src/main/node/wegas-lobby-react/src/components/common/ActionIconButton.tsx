/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { ConfirmIconButton } from '../common/ConfirmIconButton';
import IconButton from '../common/IconButton';

export interface ActionIconButton {
  onClick: () => Promise<unknown>;
  title: string;
  className?: string;
  icon: IconProp;
  children?: React.ReactNode;
  shouldConfirm?: boolean | 'HARD' | 'SOFT_LEFT' | 'SOFT_CENTER' | 'SOFT_RIGHT';
  delay?: number;
  confirmMessage?: React.ReactNode;
}

export default function ActionIconButton({
  shouldConfirm = false,
  className,
  icon = faPlay,
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
    const result = window.confirm('Confirm ?');
    if (result) {
      onClickCb();
    }
  }, [onClickCb]);

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
        <ConfirmIconButton position={'CENTER'} icon={icon} onConfirm={onClickCb} title={title}>
          {children}
        </ConfirmIconButton>
      );
    } else if (shouldConfirm === 'SOFT_LEFT') {
      return (
        <ConfirmIconButton position={'LEFT'} icon={icon} onConfirm={onClickCb} title={title}>
          {children}
        </ConfirmIconButton>
      );
    } else if (shouldConfirm === 'SOFT_RIGHT') {
      return (
        <ConfirmIconButton position={'RIGHT'} icon={icon} onConfirm={onClickCb} title={title}>
          {children}
        </ConfirmIconButton>
      );
    } else if (shouldConfirm === 'HARD') {
      return (
        <IconButton className={className} icon={icon} onClick={winConfirmCb} title={title}>
          {children}
        </IconButton>
      );
    } else {
      return (
        <IconButton className={className} icon={icon} onClick={onClickCb} title={title}>
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