import { css, CSSObject } from '@emotion/css';
import { debounce } from 'lodash-es';
import * as React from 'react';
import { classNameOrEmpty } from '../../Helper/className';
import { themeVar } from '../Theme/ThemeVars';

export const inputDefaultCSS = {
  minWidth: '4em',
  minHeight: '1.9em',
};

export const inputStyleCSS: CSSObject = {
  ...inputDefaultCSS,
  width: '100%',
  resize: 'vertical',
  border: '1px solid ' + themeVar.colors.DisabledColor,
  borderRadius: themeVar.dimensions.BorderRadius,
  backgroundColor: themeVar.colors.BackgroundColor,
  fontFamily: themeVar.others.TextFont2,
  color: themeVar.colors.DarkTextColor,
  outline: 'none',
  '::placeholder': {
    opacity: '0.5',
  },
  ':focus': {
    border: '1px solid ' + themeVar.colors.PrimaryColor,
  },
  ':hover': {
    border: '1px solid ' + themeVar.colors.PrimaryColor,
  },
  '&[readonly], &[disabled]': {
    color: themeVar.colors.DisabledColor,
    pointerEvents: 'none',
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
   * autoFocus - focus when rendered
   */
  autoFocus?: boolean;

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
  /**
   * allow only a certain type of input
   */
  inputType?: 'text' | 'number';
  /**
   * timer before triggering on change (100 ms by default)
   */
  debouncingTime?: number;
}

export function SimpleInput({
  value,
  onChange,
  rows,
  disabled,
  readOnly,
  placeholder,
  autoComplete,
  autoFocus,
  id,
  className,
  style,
  onFocus,
  fullWidth,
  inputType = 'text',
  debouncingTime = 100,
}: SimpleInputProps) {
  const isDebouncingRef = React.useRef(false);
  const cancelDebouncedRef = React.useRef(() => {});
  const inputRef = React.useRef<HTMLInputElement>(null);
  const textAeraRef = React.useRef<HTMLTextAreaElement>(null);
  const [currentValue, setCurrentValue] = React.useState(value);

  React.useEffect(() => {
    if (!isDebouncingRef.current) {
      setCurrentValue(value);
    }
  }, [value]);

  React.useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      textAeraRef.current?.focus();
    }
  }, [autoFocus]);

  const debouncedOnChange = React.useCallback(
    (value: string) => {
      isDebouncingRef.current = true;
      cancelDebouncedRef.current();
      const debouncedFN = debounce((value: string) => {
        onChange && onChange(value);
        isDebouncingRef.current = false;
      }, debouncingTime);
      debouncedFN(value);
      cancelDebouncedRef.current = debouncedFN.cancel;
    },
    [debouncingTime, onChange],
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
        ref={textAeraRef}
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
      ref={inputRef}
      type={inputType}
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
