/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import * as React from 'react';
import { successColor } from '../styling/color';
import { errorStyle, warningStyle } from '../styling/style';
import Flex from './Flex';

export interface Props {
  label?: React.ReactNode;
  warning?: string;
  error?: string;
  title?: string;
  value?: boolean;
  onChange: (newValue: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const containerStyle = css({
  width: '28px',
  height: '16px',
  border: 'solid 1px #d7d7d7',
  borderRadius: '8px',
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
});

const offStyle = css({
  position: 'absolute',
  width: '16px',
  height: '16px',
  padding: '0',
  margin: '0',
  top: '0',
  left: 0,
  border: 'none',
  background: '#666',
  borderRadius: '8px',
  boxSizing: 'border-box',
  transition: '.3s',
});

const onStyle = cx(
  offStyle,
  css({
    left: '12px',
    background: successColor.toString(),
  }),
);

export default function Toggler({
  label,
  warning,
  error,
  title,
  value,
  onChange,
  className,
  disabled = false,
}: Props): JSX.Element {
  return (
    <Flex className={className} direction="column">
      <Flex justify="space-between">
        {warning ? <div className={warningStyle}>{warning}</div> : null}
        {error ? <div className={errorStyle}>{error}</div> : null}
      </Flex>
      <Flex justify="space-between">
        <div
          title={title}
          onClick={disabled ? undefined : () => onChange(!value)}
          className={cx(containerStyle, className)}
        >
          <div className={value ? onStyle : offStyle}></div>
        </div>
        <div>&nbsp;{label}</div>
      </Flex>
    </Flex>
  );
}
