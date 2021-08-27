import * as React from 'react';
import { SimpleInput, InputProps } from '../SimpleInput';
import { omit } from 'lodash-es';
import { css } from 'emotion';

const numberInputStyle = css({
  textAlign: 'center',
});

export type NumberInputProps = InputProps<number>;

export function NumberInput(props: NumberInputProps) {
  return (
    <SimpleInput
      className={numberInputStyle}
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
