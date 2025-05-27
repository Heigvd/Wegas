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
  toggleInputDataError?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function NumberInput(props: NumberInputProps) {
  const { value, placeholder } = props;
  const min = props.min ?? Number.NEGATIVE_INFINITY;
  const max = props.max ?? Number.POSITIVE_INFINITY;

  const [input, setInput] = React.useState<string | undefined>(undefined);

  const onChange = (newValue: string | number) => {
    const numberValue = Number(newValue);
    const stringValue = String(newValue);
    if (numberValue !== Number(input)) {
      setInput(stringValue);
      if (!isNaN(numberValue) && numberValue >= min && numberValue <= max) {
        props.toggleInputDataError && props.toggleInputDataError(false);
        props.onChange && props.onChange(numberValue);
      } else {
        props.toggleInputDataError && props.toggleInputDataError(true);
      }
    }
  };

  // Prevent wegas value from overriding current input
  React.useEffect(() => {
    if (value !== Number(input)) {
      setInput(String(value));
    }
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
        onChange={newValue => onChange(newValue)}
        inputType="text"
        placeholder={placeholder}
      />
    </div>
  );
}
