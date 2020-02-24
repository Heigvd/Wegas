import * as React from 'react';
import { debounce } from 'lodash-es';

import { inputStyle } from './inputStyles';

function undefToEmpty(val?: string | number) {
  if (val == null) {
    return '';
  } else if (typeof val === 'number') {
    return JSON.stringify(val);
  }
  return val;
}

export interface SimpleInputProps {
  /**
   * value - the value to input
   */
  value?: string | number;
  /**
   * onChange - return the value set by the component
   */
  onChange?: (value: string) => void;
  /**
   * rows - the number of rows allowed for input
   */
  rows?: number;
  /**
   * disabled - disable the component
   */
  disabled?: boolean;
  /**
   * readOnly - disable the click on the component
   */
  readOnly?: boolean;
  /**
   * placeholder - the hint displayed in the input zone
   */
  placeholder?: string;
  /**
   * autoComplete - enables the browser autocompletion
   */
  autoComplete?: boolean;
  /**
   * id - enables the browser autocompletion
   */
  id?: string;
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
}: SimpleInputProps) {
  const [currentValue, setCurrentValue] = React.useState(value);

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const debouncedOnChange = React.useCallback(
    debounce((value: string) => {
      onChange && onChange(value);
    }, 500),
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
        className={inputStyle}
        id={id}
        value={undefToEmpty(currentValue)}
        rows={rows}
        onChange={onInputChange}
        placeholder={placeholder}
        onBlur={onInputChange}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete ? 'on' : 'off'}
      />
    );
  }
  return (
    <input
      type="text"
      className={inputStyle}
      id={id}
      value={undefToEmpty(currentValue)}
      onChange={onInputChange}
      placeholder={placeholder}
      onBlur={onInputChange}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete={autoComplete ? 'on' : 'off'}
    />
  );
}
