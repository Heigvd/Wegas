/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import IconButton from './IconButton';

export interface Props {
  icon: IconProp;
  title?: string;
  className?: string;
  onConfirm: () => void;
  children?: React.ReactNode;
}

export function ConfirmIconButton({
  children,
  className,
  icon,
  onConfirm,
  title,
}: Props): JSX.Element {
  const [waitConfirm, setConfirm] = React.useState(false);

  const askConfirm = React.useCallback(() => {
    setConfirm(false);
  }, []);

  const confirmedCb = React.useCallback(() => {
    setConfirm(false);
    onConfirm();
  }, [onConfirm]);

  return (
    <div title={title || 'destroy'}>
      {waitConfirm ? (
        <IconButton className={className} icon={icon}>
          <IconButton title={`cancel ${title}`} icon={faTimes} onClick={askConfirm} />
          <IconButton title={`confirm ${title}`} icon={faCheck} onClick={confirmedCb} />
        </IconButton>
      ) : (
        <div>
          <IconButton className={className} icon={icon} onClick={() => setConfirm(true)}>
            {children}
          </IconButton>
        </div>
      )}
    </div>
  );
}
