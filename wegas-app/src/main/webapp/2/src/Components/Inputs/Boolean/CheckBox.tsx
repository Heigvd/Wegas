import * as React from 'react';
import { css, cx } from 'emotion';
import { InputProps } from '../SimpleInput';
import { Value } from '../../Outputs/Value';
import { textCenter, shrinkWidth } from '../../../css/classes';
import { themeVar } from '../../Style/ThemeVars';
import { Button } from '../Buttons/Button';

const checkboxStyle = (disabled?: boolean, readOnly?: boolean) =>
  css({
    cursor: disabled || readOnly ? 'default' : 'pointer',
    color: disabled
      ? themeVar.Common.colors.DisabledColor
      : readOnly
      ? themeVar.Common.colors.HeaderColor
      : themeVar.Common.colors.TextColor,
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
      className={cx(textCenter, className, shrinkWidth)}
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
        className={cx(checkboxStyle(disabled, readOnly), checkBoxClassName)}
        disabled={disabled}
        noHover={disabled}
      />
    </div>
  );
}
