/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {cx} from '@emotion/css';
import * as React from 'react';
import {buttonStyle, inactiveButtonStyle} from '../styling/style';
import Clickable from './Clickable';

export interface ButtonProps {
  onClick?: () => void;
  label: string;
  className?: string;
}

export default function Button({onClick, label, className}: ButtonProps): JSX.Element {
  return (
    <Clickable
      onClick={onClick}
      title={label}
      className={cx(inactiveButtonStyle, className)}
      clickableClassName={cx(buttonStyle, className)}
    >
      {label}
    </Clickable>
  );
}
