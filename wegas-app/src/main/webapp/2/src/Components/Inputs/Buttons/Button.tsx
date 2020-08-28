import * as React from 'react';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { Icons, IconComp } from '../../../Editor/Components/Views/FontAwesome';
import { arrayRemoveDuplicates } from '../../../Helper/tools';

export interface DisableBorders {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
  topLeft?: boolean;
  topRight?: boolean;
  bottomLeft?: boolean;
  bottomRight?: boolean;
}

export function disableBorderToSelector(disableBorders?: DisableBorders) {
  return disableBorders != null
    ? ' disabledBorders' +
        arrayRemoveDuplicates(
          Object.entries(disableBorders)
            .map(([border, disabled]) => {
              return (
                classOrNothing(
                  'borderTopLeft',
                  disabled && ['topLeft', 'left', 'top'].includes(border),
                ) +
                classOrNothing(
                  'borderTopRight',
                  disabled && ['topRight', 'right', 'top'].includes(border),
                ) +
                classOrNothing(
                  'borderBottomLeft',
                  disabled && ['bottomLeft', 'left', 'bottom'].includes(border),
                ) +
                classOrNothing(
                  'borderBottomRight',
                  disabled &&
                    ['bottomRight', 'right', 'bottom'].includes(border),
                )
              );
            })
            .join('')
            .split(' '),
        ).join(' ')
    : '';
}

export interface ButtonProps extends ClassAndStyle {
  label?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  tabIndex?: number;
  tooltip?: string;
  noHover?: boolean;
  type?: 'submit' | 'reset' | 'button';
  id?: string;
  disableBorders?: DisableBorders;
  icon?: Icons;
  pressed?: boolean;
  prefixedLabel?: boolean;
  noBackground?: boolean;
  mode?: 'active' | 'success' | 'warning' | 'error';
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.PropsWithChildren<ButtonProps>
>(
  (
    {
      label,
      onClick,
      disabled,
      readOnly,
      noHover,
      disableBorders,
      className,
      style,
      children,
      tabIndex,
      tooltip,
      type,
      id,
      icon,
      pressed,
      prefixedLabel,
      noBackground,
      mode: buttonModes,
    },
    ref,
  ) => {
    const computedLabel =
      icon && (label || children) ? (
        <div
          style={prefixedLabel ? { marginRight: '3px' } : { marginLeft: '3px' }}
        >
          {label}
          {children}
        </div>
      ) : (
        <>
          {label}
          {children}
        </>
      );

    return (
      <button
        ref={ref}
        id={id}
        className={
          'wegas wegas-btn ' +
          classOrNothing('disabled', disabled) +
          classOrNothing('readOnly', readOnly) +
          classOrNothing('noHover', noHover) +
          disableBorderToSelector(disableBorders) +
          classOrNothing('noClick', onClick == null) +
          classOrNothing('iconOnly', !label && !children && !noBackground) +
          classOrNothing('noBackground', noBackground) +
          classNameOrEmpty(buttonModes) +
          classNameOrEmpty(className)
        }
        style={style}
        onClick={onClick}
        disabled={disabled}
        tabIndex={tabIndex}
        title={tooltip}
        aria-label={tooltip}
        aria-pressed={pressed}
        type={type}
      >
        {prefixedLabel && computedLabel}
        {icon && <IconComp icon={icon} />}
        {!prefixedLabel && computedLabel}
      </button>
    );
  },
);
