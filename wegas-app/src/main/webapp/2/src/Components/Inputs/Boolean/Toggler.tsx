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
import { themeVar } from '../../Theme/ThemeVars';

const togglerStyle = css({
  display: 'flex',
  minWidth: '45px',
  height: '24px',
  boxSizing: 'border-box',
  borderRadius: '24px',
  color: themeVar.colors.LightTextColor,
  backgroundColor: themeVar.colors.ErrorColor,
  cursor: 'pointer',
  margin: 'auto',
  marginTop: '5px',
  flexDirection: 'row',
  ['&.disabled']: {
    opacity: '50%',
    borderColor: themeVar.colors.DisabledColor,
    cursor: 'default',
  },
  ['&.readOnly']: {
    borderColor: themeVar.colors.DisabledColor,
    cursor: 'default',
  },
  ['&.checked']: {
    backgroundColor: themeVar.colors.SuccessColor,
    flexDirection: 'row-reverse',
  },
});

const togglerHandleStyle = css({
  borderRadius: '20px',
  width: '17px',
  height: '17px',
  margin: '3px',
  backgroundColor: themeVar.colors.BackgroundColor,
  alignSelf: 'center',
  ['&.disabled']: {
    opacity: '50%',
    backgroundColor: themeVar.colors.DisabledColor,
  },
  ['&.readOnly']: {
    backgroundColor: themeVar.colors.DisabledColor,
  },
});

const togglerTextStyle = css({
  marginLeft: '8px',
  marginRight: '8px',
  textAlign: 'center',
});

export interface TogglerProps extends InputProps<boolean> {
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
  label?: React.ReactNode | JSX.Element;
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
  style,
  id,
}: TogglerProps) {
  return (
    <div
      id={id}
      className={
        cx(flex, flexColumn, itemCenter, shrinkWidth) +
        classNameOrEmpty(className)
      }
      style={style}
    >
      {typeof label === 'string' ? <Value value={label} /> : label}
      <div
        className={
          'wegas wegas-toggler ' +
          togglerStyle +
          ' ' +
          classOrNothing('disabled', disabled) +
          classOrNothing('readOnly', readOnly) +
          classOrNothing('checked', value) +
          classNameOrEmpty(togglerClassName)
        }
        onClick={e => {
          e.stopPropagation();
          if (!disabled && !readOnly && onChange) {
            onChange(!value);
          }
        }}
        title={hint}
      >
        <div
          className={
            'wegas-toggler-handle ' +
            togglerHandleStyle +
            ' ' +
            classOrNothing('disabled', disabled) +
            classOrNothing('readOnly', readOnly) +
            classNameOrEmpty(handlerClassName)
          }
          title={hint}
        />
        {labels && (
          <div
            className={'wegas-toggler-text ' + cx(grow, togglerTextStyle)}
            title={hint}
          >
            {value ? labels.on : labels.off}
          </div>
        )}
      </div>
    </div>
  );
}
