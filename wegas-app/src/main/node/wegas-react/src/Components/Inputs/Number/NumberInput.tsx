import { css, cx } from '@emotion/css';
import { omit } from 'lodash-es';
import * as React from 'react';
import { InputProps, SimpleInput } from '../SimpleInput';
import { CheckMinMax } from './numberComponentHelper';
import { expandWidth, flexColumn } from '../../../css/classes';

const numberInputStyle = css({
  textAlign: 'center',
});

interface NumberInputProps extends InputProps<number> {
  placeholder?: string;
  min?: number;
  max?: number;
}

export function NumberInput(props: NumberInputProps) {
  const { value, placeholder } = props;
  const min = props.min ?? Number.NEGATIVE_INFINITY;
  const max = props.max ?? Number.POSITIVE_INFINITY;

  const [input, setInput] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    setInput(value);
  }, [value]);

  return (
    <div className={cx(flexColumn, expandWidth)}>
      {(props.min !== undefined || props.max !== undefined) && (
        <CheckMinMax min={min} max={max} value={input} />
      )}
      <SimpleInput
        {...omit(props, 'onChange')}
        value={input}
        className={numberInputStyle}
        onChange={v => {
          const vN = Number(v);
          if (!isNaN(vN)) {
            setInput(vN);
            if (vN > min && vN < max) {
              props.onChange && props.onChange(vN);
            }
          }
        }}
        inputType="number"
        placeholder={placeholder}
      />
    </div>
  );
}
