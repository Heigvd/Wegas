/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { cx } from '@emotion/css';
import * as React from 'react';
import {
  errorStyle,
  inputStyle,
  labelStyle,
  smallTextStyle,
  textareaStyle,
} from '../styling/style';
import Flex from './Flex';

export interface Props {
  label?: React.ReactNode;
  inputType?: 'input' | 'textarea';
  warning?: React.ReactNode;
  error?: string;
  value?: string;
  mandatory?: boolean;
  type?: HTMLInputElement['type'];
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  readonly?: boolean;
}

export default function Input({
  type = 'text',
  label,
  inputType = 'input',
  warning,
  error,
  value = '',
  onChange,
  mandatory,
  className,
  placeholder = 'no value',
  readonly = false,
}: Props): JSX.Element {
  const [state, setState] = React.useState<string>(value || '');

  React.useEffect(() => {
    setState(value);
  }, [value]);

  const onInternalChangeCb = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setState(newValue);
    },
    [onChange],
  );

  return (
    <Flex className={className} direction="column">
      <Flex justify="space-between">
        <div className={labelStyle}>
          {label}
          {mandatory ? ' * ' : null}{' '}
        </div>
        {warning ? <div className={cx(errorStyle, smallTextStyle)}>{warning}</div> : null}
        {error ? <div className={cx(errorStyle, smallTextStyle)}>{error}</div> : null}
      </Flex>
      {inputType === 'input' ? (
        <input
          type={type}
          className={inputStyle}
          placeholder={placeholder}
          value={state || ''}
          onChange={onInternalChangeCb}
          readOnly={readonly}
          autoComplete='off'
        />
      ) : (
        <textarea
          className={textareaStyle}
          placeholder={placeholder}
          value={state || ''}
          onChange={onInternalChangeCb}
          readOnly={readonly}
          autoComplete='off'
        />
      )}
    </Flex>
  );
}
