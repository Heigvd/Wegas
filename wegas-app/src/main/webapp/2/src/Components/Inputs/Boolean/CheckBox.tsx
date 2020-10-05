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
  color: themeVar.Common.colors.TextColor,
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
   * defaultChecked - the initial state of the toggler (false by default)
   */
  defaultChecked?: boolean;
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
}

export function CheckBox({
  defaultChecked,
  value,
  onChange,
  disabled,
  readOnly,
  label,
  hint,
  checkBoxClassName,
  className,
  id,
}: CheckBoxProps) {
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
      title={hint}
    >
      {label && <Value value={label} />}
      <Button
        icon={
          checked
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
          !disabled &&
            !readOnly &&
            setChecked(v => {
              onChange && onChange(!v);
              return !v;
            });
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
