import * as React from 'react';
import { SimpleInput, InputProps } from '../SimpleInput';
import { omit } from 'lodash-es';

export type NumberInputProps = InputProps<number>;

export function NumberInput(props: NumberInputProps) {
  return (
    <SimpleInput
      {...omit(props, 'onChange')}
      onChange={v => {
        const vN = Number(v);
        if (!isNaN(vN)) {
          props.onChange && props.onChange(vN);
        }
      }}
    />
  );
}
