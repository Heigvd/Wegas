import * as React from 'react';
import { debounce } from 'lodash-es';

import { inputStyle } from './inputStyles';
import { classNameOrEmpty } from '../../Helper/className';

function undefToEmpty(val?: string | number) {
  if (val == null) {
    return '';
  } else if (typeof val === 'number') {
    return JSON.stringify(val);
  }
  return val;
}

export interface InputProps<T> extends ClassAndStyle {
  /**
   * value - the value to input
   */
  value?: T;
  /**
   * onChange - return the value set by the component
   */
  onChange?: (value: T) => void;
  /**
   * label - the current label of the input
   */
  label?: string;
  /**
   * disabled - disable the component
   */
  disabled?: boolean;
  /**
   * readOnly - disable the click on the component
   */
  readOnly?: boolean;
  /**
   * id - the id of the input
   */
  id?: string;
}

export interface SimpleInputProps extends InputProps<string | number> {
  /**
   * rows - the number of rows allowed for input
   */
  rows?: number;
  /**
   * placeholder - the hint displayed in the input zone
   */
  placeholder?: string;
  /**
   * autoComplete - controls the browser autocompletion
   */
  autoComplete?: boolean;
  /**
   * onFocus - event that fires when te input is focused
   */
  onFocus?: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export function SimpleInput({
  value,
  onChange,
  rows,
  disabled,
  readOnly,
  placeholder,
  autoComplete,
  id,
  className,
  style,
  onFocus,
}: SimpleInputProps) {
  const [currentValue, setCurrentValue] = React.useState(value);

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const debouncedOnChange = React.useCallback(
    debounce((value: string) => {
      onChange && onChange(value);
    }, 1000),
    [onChange],
  );

  const onInputChange = (
    ev:
      | React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
      | React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const value = ev.currentTarget.value;
    const type = ev.type;
    setCurrentValue(value);
    if (type === 'change') {
      debouncedOnChange(value);
    } else {
      onChange && onChange(value);
    }
  };
  if (typeof rows === 'number') {
    return (
      <textarea
        className={inputStyle + classNameOrEmpty(className)}
        style={style}
        id={id}
        value={undefToEmpty(currentValue)}
        rows={rows}
        onChange={onInputChange}
        placeholder={placeholder}
        onBlur={onInputChange}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete ? 'on' : 'off'}
        onFocus={onFocus}
      />
    );
  }
  return (
    <input
      type="text"
      className={inputStyle + classNameOrEmpty(className)}
      id={id}
      value={undefToEmpty(currentValue)}
      onChange={onInputChange}
      placeholder={placeholder}
      onBlur={onInputChange}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete={autoComplete ? 'on' : 'off'}
      onFocus={onFocus}
    />
  );
}
