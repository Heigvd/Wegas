/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { debounce } from 'lodash';
import * as React from 'react';
import { inputStyle, smallInputStyle } from '../styling/style';
import Flex from './Flex';

export interface Props {
  label?: string;
  value: string;
  size?: 'SMALL' | 'LARGE';
  onChange: (newValue: string) => void;
  placeholder?: string;
  delay?: number;
}

export default function DebouncedInput({
  label,
  value,
  onChange,
  size = 'LARGE',
  placeholder = 'no value',
  delay = 500,
}: Props): JSX.Element {
  const [state, setState] = React.useState<string>(value || '');

  React.useEffect(() => {
    setState(value);
  }, [value]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const debouncedOnChange = React.useMemo(
    () =>
      debounce((value: string) => {
        onChangeRef.current(value);
      }, delay),
    [delay],
  );

  const onInternalChangeCb = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      debouncedOnChange(newValue);
      setState(newValue);
    },
    [debouncedOnChange],
  );

  return (
    <Flex>
      <div>{label}</div>
      <input
        className={size === 'LARGE' ? inputStyle : smallInputStyle}
        placeholder={placeholder}
        value={state}
        onChange={onInternalChangeCb}
      />
    </Flex>
  );
}
