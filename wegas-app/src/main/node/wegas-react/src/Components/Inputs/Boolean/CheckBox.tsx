import { cx } from '@emotion/css';
import * as React from 'react';
import {
  flex,
  flexColumn,
  flexRow,
  itemCenter,
  shrinkWidth,
} from '../../../css/classes';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { Value } from '../../Outputs/Value';
import { Button } from '../Buttons/Button';
import { InputProps } from '../SimpleInput';

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
  /**
   * horizontal - Displays label and input on the same line
   */
  horizontal?: boolean;
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
  horizontal,
  className,
  style,
  id,
}: CheckBoxProps) {
  return (
    <div
      id={id}
      className={
        cx(flex, itemCenter, shrinkWidth, {
          [flexRow]: horizontal,
          [flexColumn]: !horizontal,
        }) + classNameOrEmpty(className)
      }
      style={style}
      title={hint}
    >
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
          classOrNothing('selected', value) +
          classNameOrEmpty(checkBoxClassName)
        }
        disabled={disabled}
        readOnly={readOnly}
      />
      {label && <Value value={label} />}
    </div>
  );
}
