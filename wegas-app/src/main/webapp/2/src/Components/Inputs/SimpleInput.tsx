import * as React from 'react';
import { debounce } from 'lodash-es';

import { classNameOrEmpty } from '../../Helper/className';

import { css, ObjectInterpolation } from 'emotion';
import { themeVar } from '../Style/ThemeVars';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.9em',
};

export const inputStyleCSS: ObjectInterpolation<undefined> = {
  ...inputDefaultCSS,
  width: '100%',
  resize: 'vertical',
  border: '2px solid ' + themeVar.Common.colors.PrimaryColor,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  outline: 'none',
  '::placeholder': {
    opacity: '0.5',
  },
  ':focus': {
    border: '2px solid ' + themeVar.Common.colors.ActiveColor,
  },
  '&[readonly]': {
    color: themeVar.Common.colors.DisabledColor,
  },
};

export const inputStyle = css(inputStyleCSS);

function undefToEmpty(val?: string | number) {
  if (val == null) {
    return '';
  } else if (typeof val === 'number') {
    return JSON.stringify(val);
  }
  return val;
}

export interface InputProps<T> extends ClassStyleId, DisabledReadonly {
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
  label?: React.ReactNode;
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
  /**
   * set width 100%
   */
  fullWidth?: boolean;
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
  fullWidth,
}: SimpleInputProps) {
  const [currentValue, setCurrentValue] = React.useState(value);

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const debouncedOnChange = React.useCallback(
    debounce((value: string) => {
      onChange && onChange(value);
    }, 100),
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
        style={{ ...(fullWidth ? { width: '100%' } : {}), ...style }}
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
      style={{ ...(fullWidth ? { width: '100%' } : {}), ...style }}
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
