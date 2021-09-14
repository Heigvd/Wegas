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
  title?: string;
  className?: string;
  icon: IconProp;
  children?: React.ReactNode;
  shouldConfirm?: boolean;
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
    if (shouldConfirm) {
      return (
        <ConfirmIconButton icon={icon} onConfirm={onClickCb} title={title}>
          {children}
        </ConfirmIconButton>
      );
    } else {
      return (
        <IconButton className={className} icon={icon} onClick={onClickCb}>
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
