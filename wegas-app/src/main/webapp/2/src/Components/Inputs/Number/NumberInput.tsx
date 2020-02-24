import * as React from 'react';
import { SimpleInputProps, SimpleInput } from '../SimpleInput';
import { omit } from 'lodash-es';

export interface NumberInputProps
  extends Omit<SimpleInputProps, 'rows' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
}

export function NumberInput(props: NumberInputProps) {
  return (
    <SimpleInput
      {...omit(props, 'onChange')}
      onChange={v => props.onChange && props.onChange(Number(v))}
    />
  );
}
