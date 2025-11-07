import { css, cx } from '@emotion/css';
import { omit } from 'lodash-es';
import * as React from 'react';
import { InputProps, SimpleInput } from '../SimpleInput';
import { CheckMinMax } from './numberComponentHelper';
import { expandWidth, flexColumn } from '../../../css/classes';
import {
  NumberSeparator,
  addSeparator,
  removeSeparator,
} from '../../PageComponents/tools/numberSeparator';
import { wlog } from '../../../Helper/wegaslog';

const numberInputStyle = css({
  textAlign: 'center',
});

interface NumberInputProps extends InputProps<number> {
  placeholder?: string;
  separator?: NumberSeparator;
  min?: number;
  max?: number;
  toggleInputDataError?: React.Dispatch<React.SetStateAction<boolean>>;
  ignoreChangesWhileFocused?: boolean
}

export function NumberInput(props: NumberInputProps) {
  const { value, placeholder, separator, ignoreChangesWhileFocused } = props;
  const min = props.min ?? Number.NEGATIVE_INFINITY;
  const max = props.max ?? Number.POSITIVE_INFINITY;

  const [input, setInput] = React.useState<string | undefined>(undefined);

  const lastChange = React.useRef<string | number>(value || '');

  const propagateChange = React.useCallback((newValue: string | number) => {
    const numberValue = removeSeparator(newValue, separator);
    const stringValue = String(newValue);

    if (numberValue !== Number(input)) {
      isNaN(numberValue)
        ? setInput(stringValue)
        : setInput(addSeparator(numberValue, separator));
      if (!isNaN(numberValue) && numberValue >= min && numberValue <= max) {
        props.toggleInputDataError && props.toggleInputDataError(false);
        props.onChange && props.onChange(numberValue);
      } else {
        props.toggleInputDataError && props.toggleInputDataError(true);
      }
    }
  }, [min, max, props.toggleInputDataError, props.onChange]);

  const onChange = React.useCallback((newValue: string | number) => {
    lastChange.current = newValue;
    if (!ignoreChangesWhileFocused) {
      propagateChange(newValue);
    }

  },[ignoreChangesWhileFocused, propagateChange, lastChange]);

  const onBlur = React.useCallback((_: any) => {
    wlog(lastChange.current);
    propagateChange(lastChange.current);
  },[lastChange]);
  // rm last change ?
  React.useEffect(() => {
    // remove if ?
    if (value !== Number(input)) {
      setInput(addSeparator(value, separator));
      lastChange.current = value || '';
    }
  }, [value]);

  return (
    <div className={cx(flexColumn, expandWidth)}>
      {(props.min !== undefined || props.max !== undefined) && (
        <CheckMinMax min={min} max={max} value={input} />
      )}
      <SimpleInput
        {...omit(props, 'onChange', 'value', 'className')}
        value={input}
        className={cx(numberInputStyle, props.className)}
        onChange={onChange}
        inputType="text"
        placeholder={placeholder}
        onBlur={onBlur}
        />
    </div>
  );
}
