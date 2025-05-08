import { css, CSSObject } from '@emotion/css';
import * as React from 'react';
import { classNameOrEmpty } from '../../Helper/className';
import { useDebouncedOnChange } from '../Hooks/useDebounce';
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
    //pointerEvents: 'none', // ability to select readonly text is quite useful!
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
   * onFocus - event that fires when the input is focused
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
  debouncingTime = 400,
}: SimpleInputProps) {
  const elementRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (autoFocus) {
      elementRef.current?.focus();
    }
  }, [autoFocus]);

  const { currentValue, debouncedOnChange, } = useDebouncedOnChange(
    value,
    onChange,
    debouncingTime,
  );

  const onInputChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      debouncedOnChange(ev.currentTarget.value);
    }
      ,
    [debouncedOnChange],
  );

  if (typeof rows === 'number') {
    return (
      <textarea
        ref={e => elementRef.current = e}
        className={inputStyle + classNameOrEmpty(className)}
        style={{ ...(fullWidth ? { width: '100%' } : {}), ...style }}
        id={id}
        value={undefToEmpty(currentValue)}
        rows={rows}
        onChange={onInputChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete ? 'on' : 'off'}
        onFocus={onFocus}
      />
    );
  }
  return (
    <input
      ref={e => elementRef.current = e}
      type={inputType}
      className={inputStyle + classNameOrEmpty(className)}
      style={{ ...(fullWidth ? { width: '100%' } : {}), ...style }}
      id={id}
      value={undefToEmpty(currentValue)}
      onChange={onInputChange}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete={autoComplete ? 'on' : 'off'}
      onFocus={onFocus}
    />
  );
}
