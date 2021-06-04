import * as React from 'react';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { Icons, IconComp } from '../../../Editor/Components/Views/FontAwesome';
import { arrayRemoveDuplicates } from '../../../Helper/tools';
import { css } from 'emotion';
import { themeVar } from '../../Theme/ThemeVars';

export const buttonStyle = css({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: themeVar.colors.PrimaryColor,
  color: themeVar.colors.LightTextColor,
  ['&.dark']: {
    backgroundColor: themeVar.colors.LightTextColor,
    color: themeVar.colors.PrimaryColor,
  },
  borderStyle: 'none',
  paddingLeft: '10px',
  paddingRight: '10px',
  paddingTop: '5px',
  paddingBottom: '5px',
  cursor: 'pointer',
  fontFamily: themeVar.others.TextFont2,
  borderRadius: themeVar.dimensions.BorderRadius,

  ['&:not(.disabled):not(.readOnly):not(.iconOnly):not(.noBackground):not(.confirmBtn):hover']:
    {
      color: themeVar.colors.HoverTextColor,
      backgroundColor: themeVar.colors.PrimaryColorShade,
      outline: 'none',
    },
  ['&:focus']: {
    outline: 'none',
  },
  ['&.readOnly']: {
    cursor: 'initial',
  },
  ['&.disabled']: {
    cursor: 'initial',
    backgroundColor: themeVar.colors.DisabledColor,
  },
  ['&.noBackground']: {
    ['&:not(.disabled):not(.readOnly):hover']: {
      color: themeVar.colors.HoverColor,
    },
    backgroundColor: 'transparent',
  },
  ['&.noClick']: {
    cursor: 'inherit',
  },
  ['&.iconOnly']: {
    color: themeVar.colors.DarkTextColor,
    backgroundColor: 'transparent',
    ['&:not(.disabled):not(.readOnly):hover']: {
      color: themeVar.colors.ActiveColor,
    },
    ['&:disabled']: {
      color: themeVar.colors.DisabledColor,
      [':hover']: {
        color: themeVar.colors.DisabledColor,
      },
    },
  },
  ['&.disabledBorders']: {
    ['&.borderTopLeft']: {
      borderTopLeftRadius: 'unset',
    },
    ['&.borderTopRight']: {
      borderTopRightRadius: 'unset',
    },
    ['&.borderBottomLeft']: {
      borderBottomLeftRadius: 'unset',
    },
    ['&.borderBottomRight']: {
      borderBottomRightRadius: 'unset',
    },
  },
  ['&.confirmBtn']: {
    display: 'flex',
    padding: '5px',
    backgroundColor: themeVar.colors.HeaderColor,
    textAlign: 'center',
    width: 'max-content',
  },
  ['&.active']: {
    ['&:not(.iconOnly),&:not(noBackground)']: {
      backgroundColor: themeVar.colors.ActiveColor,
    },
    ['&.iconOnly,&.noBackground']: {
      color: themeVar.colors.ActiveColor,
    },
  },
  ['&.success']: {
    ['&:not(.iconOnly),&:not(.noBackground)']: {
      backgroundColor: themeVar.colors.SuccessColor,
    },
    ['&.iconOnly,&.noBackground']: {
      color: themeVar.colors.SuccessColor,
    },
  },
  ['&.warning']: {
    // backgroundColor: themeVar.colors.WarningColor,
    ['&:not(.iconOnly),&:not(.noBackground)']: {
      backgroundColor: themeVar.colors.WarningColor,
    },
    ['&.iconOnly,&.noBackground']: {
      color: themeVar.colors.WarningColor,
    },
  },
  ['&.error']: {
    ['&:not(.iconOnly),&:not(.noBackground)']: {
      backgroundColor: themeVar.colors.ErrorColor,
    },
    ['&.iconOnly,&.noBackground']: {
      color: themeVar.colors.ErrorColor,
    },
  },
});

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

export interface ButtonProps extends ClassStyleId, DisabledReadonly {
  label?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  tabIndex?: number;
  tooltip?: string;
  noHover?: boolean;
  type?: 'submit' | 'reset' | 'button';
  id?: string;
  disableBorders?: DisableBorders;
  icon?: Icons;
  src?: string;
  pressed?: boolean;
  prefixedLabel?: boolean;
  noBackground?: boolean;
  mode?: 'active' | 'success' | 'warning' | 'error';
  dark?: boolean;
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
      src,
      pressed,
      prefixedLabel,
      noBackground,
      mode: buttonModes,
      dark,
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
          buttonStyle +
          ' ' +
          classOrNothing('disabled', disabled) +
          classOrNothing('readOnly', readOnly) +
          classOrNothing('noHover', noHover) +
          disableBorderToSelector(disableBorders) +
          classOrNothing('noClick', onClick == null) +
          classOrNothing('iconOnly', !label && !children && !noBackground) +
          classOrNothing('noBackground', noBackground) +
          classOrNothing('dark', dark) +
          classNameOrEmpty(buttonModes) +
          classNameOrEmpty(className)
        }
        style={style}
        onClick={e => !readOnly && onClick && onClick(e)}
        disabled={disabled}
        tabIndex={tabIndex}
        title={tooltip}
        aria-label={tooltip}
        aria-pressed={pressed}
        type={type}
      >
        {prefixedLabel && computedLabel}
        {icon && <IconComp icon={icon} />}
        {src && <img alt={tooltip} src={src} />}
        {!prefixedLabel && computedLabel}
      </button>
    );
  },
);
