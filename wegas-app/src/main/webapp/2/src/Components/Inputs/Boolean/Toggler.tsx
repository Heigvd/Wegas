import * as React from 'react';
import { cx } from 'emotion';
import { InputProps } from '../SimpleInput';
import { Value } from '../../Outputs/Value';
import { textCenter, shrinkWidth } from '../../../css/classes';
import { classOrNothing, classNameOrEmpty } from '../../../Helper/className';

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
   * label - the label to display over the toggler
   */
  label?: string;
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
  label,
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
    <div id={id} className={cx(textCenter, className, shrinkWidth)}>
      {label && <Value value={label} />}
      <div
        className={
          'wegas wegas-toggler' +
          classOrNothing('disabled', disabled) +
          classOrNothing('readOnly', readOnly) +
          classOrNothing('checked', checked) +
          classNameOrEmpty(togglerClassName)
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
        title={hint}
      >
        {!checked && (
          <div style={{ flex: '1 1 auto' }} title={hint}>
            {labels ? labels.off : ''}
          </div>
        )}
        <div
          className={
            'wegas wegas-toggler-handle' +
            classOrNothing('disabled', disabled) +
            classNameOrEmpty(handlerClassName)
          }
          title={hint}
        />
        {checked && (
          <div style={{ flex: '1 1 auto' }} title={hint}>
            {labels ? labels.on : ''}
          </div>
        )}
      </div>
    </div>
  );
}
