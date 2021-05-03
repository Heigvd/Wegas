import * as React from 'react';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { Icons, IconComp } from '../../../Editor/Components/Views/FontAwesome';
import { css } from 'emotion';
import { themeVar } from '../../Style/ThemeVars';

export const iconButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  color: themeVar.Common.colors.PrimaryColor,
  backgroundColor: 'transparent',
  ['&.dark']: {
    backgroundColor: themeVar.Common.colors.LightTextColor,
    color: themeVar.Common.colors.PrimaryColor,
  },
  borderStyle: 'none',
  paddingLeft: '10px',
  paddingRight: '10px',
  paddingTop: '5px',
  paddingBottom: '5px',
  cursor: 'pointer',
  fontFamily: themeVar.Common.others.TextFont2,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  ['&:not(.disabled):not(.readOnly):hover']: {
    color: themeVar.Common.colors.ActiveColor,
  },
  ['&:focus']: {
    outline: 'none',
  },
  ['&.readOnly']: {
    cursor: 'initial',
  },
  ['&.disabled']: {
    cursor: 'initial',
    backgroundColor: themeVar.Common.colors.DisabledColor,
    color: themeVar.Common.colors.DisabledColor,
  },
  ['&.noClick']: {
    cursor: 'inherit',
  },
  ['&.success']: {
    ['&.iconOnly']: {
      color: themeVar.Common.colors.SuccessColor,
    },
  },
  ['&.warning']: {
    ['&.iconOnly']: {
      color: themeVar.Common.colors.WarningColor,
    },
  },
  ['&.error']: {
    ['&.iconOnly']: {
      color: themeVar.Common.colors.ErrorColor,
    },
  },
});


export interface IconButtonProps extends ClassStyleId, DisabledReadonly {
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  tabIndex?: number;
  tooltip?: string;
  noHover?: boolean;
  type?: 'submit' | 'reset' | 'button';
  id?: string;
  icon: Icons;
  src?: string;
  pressed?: boolean;
  mode?: 'active' | 'success' | 'warning' | 'error';
  dark?: boolean;
}

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.PropsWithChildren<IconButtonProps>
>(
  (
    {
      onClick,
      disabled,
      readOnly,
      noHover,
      className,
      style,
      tabIndex,
      tooltip,
      type,
      id,
      icon,
      src,
      pressed,
      mode: buttonModes,
      dark,
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        id={id}
        className={
          'wegas wegas-iconbtn iconOnly ' +
          iconButtonStyle +
          ' ' +
          classOrNothing('disabled', disabled) +
          classOrNothing('readOnly', readOnly) +
          classOrNothing('noHover', noHover) +
          classOrNothing('noClick', onClick == null) +
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
        {<IconComp icon={icon} />}
        {src && <img alt={tooltip} src={src} />}
      </button>
    );
  },
);
