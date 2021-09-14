/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { errorStyle, warningStyle } from '../styling/style';
import Flex from './Flex';
import IconButton from './IconButton';

export interface Props {
  label?: React.ReactNode;
  warning?: string;
  error?: string;
  title?: string;
  disabled?: boolean;
  value?: boolean;
  onChange: (newValue: boolean) => void;
  className?: string;
}

const disabledStyle = css({
  color: 'var(--disabledFgColor)',
});
const enabledStyle = css({ cursor: 'pointer' });

export default function Checkbox({
  label,
  warning,
  error,
  title,
  disabled = false,
  value,
  onChange,
  className,
}: Props): JSX.Element {
  return (
    <Flex className={className} direction="column">
      <Flex justify="space-between">
        {warning ? <div className={warningStyle}>{warning}</div> : null}
        {error ? <div className={errorStyle}>{error}</div> : null}
      </Flex>
      <Flex
        className={disabled ? disabledStyle : enabledStyle}
        justify="flex-start"
        onClick={disabled ? undefined : () => onChange(!value)}
      >
        <IconButton title={title} icon={value ? faCheckSquare : faSquare}>
          {label}
        </IconButton>
      </Flex>
    </Flex>
  );
}
