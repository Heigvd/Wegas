/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faArchive, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { IGame } from 'wegas-ts-api';

export interface Props {
  status: IGame['status'];
}

const style = css({
  padding: '0 10px',
  color: '#999',
});

export default function StatusIcon({ status }: Props): JSX.Element {
  switch (status) {
    case 'BIN':
      return <FontAwesomeIcon className={style} icon={faArchive} size="2x" />;
    case 'DELETE':
    case 'SUPPRESSED':
      return <FontAwesomeIcon className={style} icon={faTrashAlt} size="2x" />;
    default:
      return <></>;
  }
}
