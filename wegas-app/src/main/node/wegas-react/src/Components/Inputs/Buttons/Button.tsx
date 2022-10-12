import { css, cx } from '@emotion/css';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { grow, secondaryButtonCSS } from '../../../css/classes';
import { IconComp, Icons } from '../../../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { arrayRemoveDuplicates } from '../../../Helper/tools';
import { themeVar } from '../../Theme/ThemeVars';

export const headerOutlineButtonStyle = css({
  border: '1px solid ' + themeVar.colors.DisabledColor,
  borderRadius: '50%',
  height: '40px',
  width: '40px',
  justifyContent: 'center',
  button: {
    padding: 0,
    width: '100%',
    justifyContent: 'center',
  },
});
export const outlineButtonStyle = {
  border: '1px solid ' + themeVar.colors.LightTextColor,
  backgroundColor: 'transparent',
};

export const outlinePrimaryButtonStyle = css({
  border: '1px solid ' + themeVar.colors.PrimaryColor,
  backgroundColor: 'transparent',
  color: themeVar.colors.PrimaryColor,
  ['&:hover']: {
    backgroundColor: themeVar.colors.HeaderColor,
  },
});

export const internalButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
});

export const loadingStyle = cx(
  internalButtonStyle,
  css({
    opacity: 0,
  }),
);

export const buttonStyle = css({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: themeVar.colors.PrimaryColor,
  color: themeVar.colors.LightTextColor,
  borderStyle: 'none',
  paddingLeft: '10px',
  paddingRight: '10px',
  paddingTop: '5px',
  paddingBottom: '5px',
  cursor: 'pointer',
  fontFamily: themeVar.others.TextFont2,
  borderRadius: themeVar.dimensions.BorderRadius,
  ['&:hover']: {
    backgroundColor: themeVar.colors.PrimaryColorShade,
  },
  ['&:focus']: {
    outline: 'none',
  },
  ['&:focus-visible']: {
    backgroundColor: themeVar.colors.PrimaryColorShade,
  },
  ['&.readOnly']: {
    cursor: 'initial',
    ['&:hover']: {
      backgroundColor: themeVar.colors.PrimaryColor,
    },
  },
  ['&.disabled']: {
    cursor: 'initial',
    backgroundColor: themeVar.colors.DisabledColor,
  },
  ['&.noClick']: {
    cursor: 'inherit',
  },
  ['&.iconOnly, &.noBackground']: {
    color: themeVar.colors.PrimaryColor,
    backgroundColor: 'transparent',
    ['&:hover, &:focus']: {
      color: themeVar.colors.PrimaryColorShade,
    },
    ['&.disabled']: {
      color: themeVar.colors.DisabledColor,
    },
    ['&.readOnly:hover, &.readOnly:focus']: {
      color: themeVar.colors.PrimaryColor,
      backgroundColor: 'transparent',
    },
  },
  ['&.dark']: {
    ...secondaryButtonCSS,
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
  ['&.active']: {
    backgroundColor: themeVar.colors.ActiveColor,
    ['&.iconOnly,&.noBackground']: {
      color: themeVar.colors.ActiveColor,
    },
  },
  ['&.success']: {
    backgroundColor: themeVar.colors.SuccessColor,
    ['&:hover, &:focus-visible']: {
      backgroundColor: themeVar.colors.PrimaryColorShade,
    },
    ['&.iconOnly,&.noBackground']: {
      color: themeVar.colors.SuccessColor,
      backgroundColor: 'transparent',
      ['&:hover']: {
        color: themeVar.colors.ActiveColor,
      },
      ['&.disabled']: {
        color: themeVar.colors.DisabledColor,
        backgroundColor: 'transparent',
      },
      ['&.readOnly:hover']: {
        color: themeVar.colors.SuccessColor,
        backgroundColor: 'transparent',
      },
    },
    ['&.readOnly:hover']: {
      backgroundColor: themeVar.colors.SuccessColor,
    },
    ['&.disabled']: {
      backgroundColor: themeVar.colors.DisabledColor,
    },
  },
  ['&.warning']: {
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
  disableBorders?: DisableBorders;
  icon?: Icons;
  src?: string;
  pressed?: boolean;
  prefixedLabel?: boolean;
  noBackground?: boolean;
  mode?: 'active' | 'success' | 'warning' | 'error';
  dark?: boolean;
  iconPositionning?: 'spread' | 'pack';
  loading?: boolean;
}

export const loadingOverlayStyle = css({
  position: 'absolute',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.PropsWithChildren<ButtonProps> &
    React.DetailedHTMLProps<
      React.ButtonHTMLAttributes<HTMLElement>,
      HTMLElement
    >
>(
  (
    {
      label,
      onClick,
      disabled,
      readOnly,
      loading,
      noHover,
      disableBorders,
      className,
      style,
      children,
      //  tabIndex,
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
      iconPositionning,
      ...defaultButtonProps
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
        {...defaultButtonProps}
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
        title={tooltip || defaultButtonProps.title}
        aria-label={tooltip || defaultButtonProps['aria-label']}
        aria-pressed={pressed || defaultButtonProps['aria-pressed']}
      >
        <div className={loading ? loadingStyle : internalButtonStyle}>
          {prefixedLabel && (
            <>
              {computedLabel}
              {iconPositionning === 'spread' && <div className={grow} />}
            </>
          )}
          {icon && <IconComp icon={icon} />}
          {src && <img alt={tooltip} src={src} />}
          {!prefixedLabel && (
            <>
              {iconPositionning === 'spread' && <div className={grow} />}
              {computedLabel}
            </>
          )}
        </div>
        {loading && (
          <div className={loadingOverlayStyle}>
            <FontAwesomeIcon icon={faSpinner} pulse />
          </div>
        )}
      </button>
    );
  },
);
