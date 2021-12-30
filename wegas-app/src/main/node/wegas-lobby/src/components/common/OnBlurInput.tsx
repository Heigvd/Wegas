/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { inputStyle, smallInputStyle } from '../styling/style';
import Flex from './Flex';

export interface Props {
  className?: string;
  label?: string;
  value: string;
  size?: 'SMALL' | 'LARGE';
  onChange: (newValue: string) => void;
  placeholder?: string;
}

export default function OnBlurInput({
  className,
  label,
  value,
  onChange,
  size = 'LARGE',
  placeholder = 'no value',
}: Props): JSX.Element {
  const [state, setState] = React.useState<string>(value || '');

  React.useEffect(() => {
    setState(value);
  }, [value]);

  const onInternalChangeCb = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setState(newValue);
  }, []);

  const onInternalBlurCb = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
    },
    [onChange],
  );

  return (
    <Flex className={className}>
      <div>{label}</div>
      <input
        className={size === 'LARGE' ? inputStyle : smallInputStyle}
        placeholder={placeholder}
        value={state}
        onChange={onInternalChangeCb}
        onBlur={onInternalBlurCb}
      />
    </Flex>
  );
}
