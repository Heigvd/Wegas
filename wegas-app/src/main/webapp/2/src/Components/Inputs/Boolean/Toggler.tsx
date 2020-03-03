import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../../Theme';
import { InputProps } from '../SimpleInput';

const togglerStyle = (disabled?: boolean, inactive?: boolean) =>
  css({
    minWidth: '50px',
    width: 'fit-content',
    height: '24px',
    borderRadius: '24px',
    borderStyle: 'solid',
    borderWidth: '2px',
    borderColor: disabled ? themeVar.disabledColor : themeVar.primaryColor,
    cursor: disabled || inactive ? 'deafult' : 'pointer',
  });

const handleStyle = css({
  borderRadius: '20px',
  minWidth: '20px',
  height: '20px',
  backgroundColor: themeVar.primaryColor,
});

export interface TogglerProps extends InputProps<boolean> {
  /**
   * defaultChecked - the initial state of the toggler (false by default)
   */
  defaultChecked?: boolean;
  /**
   * togglerClassName - the className of the component
   */
  togglerClassName?: string;
  /**
   * handlerClassName - the className of the handle
   */
  handlerClassName?: string;
  /**
   * labels - the labels to be displayed in the toggle background
   */
  labels?: { on: React.ReactNode; off: React.ReactNode };
  /**
   * hint - the hint that will be displayed when the mouse hover the component
   */
  hint?: string;
}

export function Toggler({
  defaultChecked,
  value,
  onChange,
  togglerClassName,
  handlerClassName,
  disabled,
  readOnly,
  labels,
  hint,
  className,
  id,
}: TogglerProps) {
  const [checked, setChecked] = React.useState(
    defaultChecked !== undefined
      ? defaultChecked
      : value !== undefined
      ? value
      : false,
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setChecked(value);
    }
  }, [value]);

  return (
    <div
      id={id}
      className={
        className
          ? className
          : togglerClassName
          ? togglerClassName
          : togglerStyle(disabled, readOnly)
      }
      onClick={e => {
        e.stopPropagation();
        !disabled &&
          !readOnly &&
          setChecked(v => {
            onChange && onChange(!v);
            return !v;
          });
      }}
      style={{
        backgroundColor: checked ? themeVar.successColor : themeVar.errorColor,
        display: 'flex',
      }}
      title={hint}
    >
      {!checked && (
        <div style={{ flex: '1 1 auto' }} title={hint}>
          {labels ? labels.off : ''}
        </div>
      )}
      <div
        className={handlerClassName ? handlerClassName : handleStyle}
        title={hint}
      />
      {checked && (
        <div style={{ flex: '1 1 auto' }} title={hint}>
          {labels ? labels.on : ''}
        </div>
      )}
    </div>
  );
}
