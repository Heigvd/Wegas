import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../Theme';

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

export interface TogglerProps {
  /**
   * defaultChecked - the initial state of the toggler (false by default)
   */
  defaultChecked?: boolean;
  /**
   * checked - the current state of the toggler
   */
  checked?: boolean;
  /**
   * onClick - returns the actual value of the toggler
   */
  onClick?: (value: boolean) => void;
  /**
   * disabled - if true, the component will show as disabled
   */
  disabled?: boolean;
  /**
   * inactive - if true, the component will be readonly
   */
  inactive?: boolean;
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
  checked,
  onClick,
  togglerClassName,
  handlerClassName,
  disabled,
  inactive,
  labels,
  hint,
}: TogglerProps) {
  const [value, setValue] = React.useState(
    defaultChecked !== undefined
      ? defaultChecked
      : checked !== undefined
      ? checked
      : false,
  );

  React.useEffect(() => {
    if (checked !== undefined) {
      setValue(checked);
    }
  }, [checked]);

  return (
    <div
      className={
        togglerClassName ? togglerClassName : togglerStyle(disabled, inactive)
      }
      onClick={e => {
        e.stopPropagation();
        !disabled &&
          !inactive &&
          setValue(v => {
            onClick && onClick(!v);
            return !v;
          });
      }}
      style={{
        backgroundColor: value ? themeVar.successColor : themeVar.errorColor,
        display: 'flex',
      }}
      title={hint}
    >
      {!value && (
        <div style={{ flex: '1 1 auto' }} title={hint}>
          {labels ? labels.off : ''}
        </div>
      )}
      <div
        className={handlerClassName ? handlerClassName : handleStyle}
        title={hint}
      />
      {value && (
        <div style={{ flex: '1 1 auto' }} title={hint}>
          {labels ? labels.on : ''}
        </div>
      )}
    </div>
  );
}
