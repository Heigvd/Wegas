import * as React from 'react';
import { cx, css } from 'emotion';
import { InputProps } from '../SimpleInput';
import { Value } from '../../Outputs/Value';
import {
  shrinkWidth,
  grow,
  flex,
  flexColumn,
  itemCenter,
} from '../../../css/classes';
import { classOrNothing, classNameOrEmpty } from '../../../Helper/className';
import { themeVar } from '../../Style/ThemeVars';

const togglerStyle = css({
  display: 'flex',
  minWidth: '50px',
  height: '24px',
  boxSizing: 'border-box',
  borderRadius: '24px',
  borderStyle: 'solid',
  borderWidth: '2px',
  color: themeVar.Common.colors.SecondaryTextColor,
  borderColor: themeVar.Common.colors.BorderColor,
  backgroundColor: themeVar.Common.colors.ErrorColor,
  cursor: 'pointer',
  margin: 'auto',
  flexDirection: 'row',
  ['&.disabled']: {
    borderColor: themeVar.Common.colors.DisabledColor,
    cursor: 'default',
  },
  ['&.readOnly']: {
    cursor: 'default',
  },
  ['&.checked']: {
    backgroundColor: themeVar.Common.colors.SuccessColor,
    flexDirection: 'row-reverse',
  },
});

const togglerHandleStyle = css({
  borderRadius: '20px',
  width: '20px',
  height: '20px',
  backgroundColor: themeVar.Common.colors.MainColor,
  ['&.disabled']: {
    backgroundColor: themeVar.Common.colors.DisabledColor,
  },
});

const togglerTextStyle = css({
  marginLeft: '8px',
  marginRight: '8px',
  textAlign: 'center',
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
    <div
      id={id}
      className={
        cx(flex, flexColumn, itemCenter, shrinkWidth) +
        classNameOrEmpty(className)
      }
    >
      {label && <Value value={label} />}
      <div
        className={
          'wegas wegas-toggler ' +
          togglerStyle +
          ' ' +
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
        {/* {!checked && (
          <div
            className={'wegas-toggler-text ' + cx(grow, togglerTextStyle)}
            title={hint}
          >
            {labels ? labels.off : ''}
          </div>
        )} */}
        <div
          className={
            'wegas-toggler-handle ' +
            togglerHandleStyle +
            ' ' +
            classOrNothing('disabled', disabled) +
            classNameOrEmpty(handlerClassName)
          }
          title={hint}
        />
        {labels && (
          <div
            className={'wegas-toggler-text ' + cx(grow, togglerTextStyle)}
            title={hint}
          >
            {checked ? labels.on : labels.off}
          </div>
        )}
      </div>
    </div>
  );
}
