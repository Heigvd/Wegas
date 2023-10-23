import { css } from '@emotion/css';
import { omit } from 'lodash-es';
import * as React from 'react';
import { InputProps, SimpleInput } from '../SimpleInput';

const numberInputStyle = css({
  textAlign: 'center',
});

export type NumberInputProps = InputProps<number>;

export function NumberInput(props: NumberInputProps) {
  const { value } = props;
  const valueRef = React.useRef(String(value));
  const [inputValue, setInputValue] = React.useState<string>('');

  const onBlur = () => {
    setInputValue(String(value));
  };

  React.useEffect(() => {
    Number(valueRef.current) === value
      ? setInputValue(valueRef.current)
      : setInputValue(String(value));
  }, [value]);

  return (
    <SimpleInput
      {...omit(props, 'onChange')}
      value={inputValue}
      className={numberInputStyle}
      onChange={v => {
        const vN = Number(v);
        valueRef.current = String(v);
        if (!isNaN(vN)) {
          props.onChange && props.onChange(vN);
        }
      }}
      onBlur={onBlur}
    />
  );
}
