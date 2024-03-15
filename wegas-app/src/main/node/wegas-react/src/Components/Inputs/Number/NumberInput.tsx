import { css } from '@emotion/css';
import { omit } from 'lodash-es';
import * as React from 'react';
import { InputProps, SimpleInput } from '../SimpleInput';

const numberInputStyle = css({
  textAlign: 'center',
});

interface NumberInputProps extends InputProps<number> {
  placeholder?: string,
}

export function NumberInput(props: NumberInputProps) {
  const { value, placeholder } = props;

  return (
    <SimpleInput
      {...omit(props, 'onChange')}
      value={value}
      className={numberInputStyle}
      onChange={v => {
        const vN = Number(v);
        // valueRef.current = String(v);
        if (!isNaN(vN)) {
          props.onChange && props.onChange(vN);
        }
      }}
      inputType='number'
      placeholder={placeholder}
    />
  );
}
