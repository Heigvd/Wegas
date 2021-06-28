import * as React from 'react';
import { cx } from 'emotion';
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
  /**
   * propagateClick - avoid stopping propagation when click
   */
  propagateClick?: boolean;
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
  propagateClick,
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
          if (!propagateClick) {
            e.stopPropagation();
          }
          if (!disabled && !readOnly && onChange) {
            onChange(!value);
          }
        }}
        className={
          'wegas wegas-cbx' +
          classOrNothing('disabled', disabled) +
          classOrNothing('readOnly', readOnly) +
          classNameOrEmpty(checkBoxClassName)
        }
        disabled={disabled}
        readOnly={readOnly}
        // noHover={disabled}
      />
    </div>
  );
}
