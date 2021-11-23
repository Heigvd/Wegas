/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';

interface Props {
  size?: SizeProp;
  margin?: string;
  text?: string;
}

export default function InlineLoading({ size = '1x', text }: Props): JSX.Element {
  return (
    <div
      className={css({
        display: 'inline-block',
      })}
    >
      <FontAwesomeIcon icon={faSpinner} pulse size={size} />
      {text ? <span className={css({})}>{text}</span> : null}
    </div>
  );
}
