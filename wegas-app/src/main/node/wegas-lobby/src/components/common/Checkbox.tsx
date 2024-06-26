/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faCheckSquare, faSquare } from '@fortawesome/free-regular-svg-icons';
import * as React from 'react';
import { errorStyle, smallTextStyle } from '../styling/style';
import Flex from './Flex';
import IconButton from './IconButton';

export interface Props {
  label?: React.ReactNode;
  warning?: React.ReactNode;
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
        {warning ? <div className={cx(errorStyle, smallTextStyle)}>{warning}</div> : null}
        {error ? <div className={cx(errorStyle, smallTextStyle)}>{error}</div> : null}
      </Flex>
      <Flex className={disabled ? disabledStyle : enabledStyle} justify="flex-start">
        <IconButton
          onClick={disabled ? undefined : () => onChange(!value)}
          title={title}
          icon={value ? faCheckSquare : faSquare}
        >
          {label}
        </IconButton>
      </Flex>
    </Flex>
  );
}
