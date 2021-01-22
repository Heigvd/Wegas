import * as React from 'react';
import { cx, css } from 'emotion';
import { InputProps } from '../SimpleInput';
import { Value } from '../../Outputs/Value';
import {
  shrinkWidth,
  flexColumn,
  itemCenter,
  flex,
} from '../../../css/classes';
import { Button } from '../Buttons/Button';
import { classOrNothing, classNameOrEmpty } from '../../../Helper/className';
import { themeVar } from '../../Style/ThemeVars';

const cbxStyle = css({
  cursor: 'pointer',
  color: themeVar.Common.colors.DarkTextColor,
  textAlign: 'center',
  ['$:not(.disabled):not(.readonly):hover']: {
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
  ['&.disabled &.readOnly']: {
    cursor: 'default',
  },
});

export interface CheckBoxProps extends InputProps<boolean> {
  /**
   * checkBoxClassName - the className of the checkbox
   */
  checkBoxClassName?: string;
  /**
   * label - the label to display over the toggler
   */
  label?: string;
  /**
   * hint - the hint that will be displayed when the mouse hover the component
   */
  hint?: string;
  /**
   * radio - displays a radio button instead of a check box
   */
  radio?: boolean;
}

export function CheckBox({
  value,
  onChange,
  disabled,
  readOnly,
  label,
  hint,
  checkBoxClassName,
  radio,
  className,
  style,
  id,
}: CheckBoxProps) {
  return (
    <div
      id={id}
      className={
        cx(flex, flexColumn, itemCenter, shrinkWidth) +
        classNameOrEmpty(className)
      }
      style={style}
      title={hint}
    >
      {label && <Value value={label} />}
      <Button
        icon={
          radio
            ? value
              ? {
                  icon: {
                    prefix: 'far',
                    iconName: 'dot-circle',
                  },
                }
              : {
                  icon: {
                    prefix: 'far',
                    iconName: 'circle',
                  },
                }
            : value
            ? {
                icon: {
                  prefix: 'far',
                  iconName: 'check-square',
                },
              }
            : {
                icon: {
                  prefix: 'far',
                  iconName: 'square',
                },
              }
        }
        onClick={e => {
          e.stopPropagation();
          if (!disabled && !readOnly && onChange) {
            onChange(!value);
          }
        }}
        className={
          'wegas wegas-cbx' +
          cbxStyle +
          ' ' +
          classOrNothing('disabled', disabled) +
          classOrNothing('readOnly', readOnly) +
          classNameOrEmpty(checkBoxClassName)
        }
        disabled={disabled}
        noHover={disabled}
      />
    </div>
  );
}
