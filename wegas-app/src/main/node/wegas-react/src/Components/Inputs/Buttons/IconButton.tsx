import * as React from 'react';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { Icons, IconComp } from '../../../Editor/Components/Views/FontAwesome';
import { css } from '@emotion/css';
import { themeVar } from '../../Theme/ThemeVars';
import { IconProp, Transform } from '@fortawesome/fontawesome-svg-core';
import { internalButtonStyle, loadingOverlayStyle, loadingStyle } from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export const iconButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  color: themeVar.colors.PrimaryColor,
  backgroundColor: 'transparent',
  borderStyle: 'none',
  paddingLeft: '5px',
  paddingRight: '5px',
  paddingTop: '5px',
  paddingBottom: '5px',
  cursor: 'pointer',
  fontFamily: themeVar.others.TextFont2,
  borderRadius: themeVar.dimensions.BorderRadius,
  ['&:hover']: {
    color: themeVar.colors.ActiveColor,
  },
  ['&:focus']: {
    color: themeVar.colors.ActiveColor,
  },
  ['&.readOnly']: {
    cursor: 'initial',
    '&:hover': {
      color: 'inherit',
    },
  },
  ['&.disabled']: {
    cursor: 'initial',
    color: themeVar.colors.DisabledColor,
    '&:hover': {
      color: themeVar.colors.DisabledColor,
    },
  },
  ['&.noClick']: {
    cursor: 'inherit',
  },
  ['&.success']: {
    ['&.iconOnly']: {
      color: themeVar.colors.SuccessColor,
    },
  },
  ['&.warning']: {
    ['&.iconOnly']: {
      color: themeVar.colors.WarningColor,
    },
  },
  ['&.error']: {
    ['&.iconOnly']: {
      color: themeVar.colors.ErrorColor,
    },
  },
  ['&.dark']: {
    backgroundColor: themeVar.colors.LightTextColor,
    color: themeVar.colors.PrimaryColor,
  },
  ['&.chip']: {
    margin: '0 3px',
    height: '33px',
    minWidth: '33px',
    width: '33px',
    justifyContent: 'center',
    backgroundColor: themeVar.colors.PrimaryColor,
    color: themeVar.colors.LightTextColor,
    borderRadius: '50%',
    padding: 0,
    fontSize: '14px',
    ['&.disabled']: {
      backgroundColor: themeVar.colors.DisabledColor,
      color: themeVar.colors.LightTextColor,
    },
   ['&:not(.disabled):not(.readOnly):hover']:
      {
        backgroundColor: themeVar.colors.ActiveColor,
        color: themeVar.colors.LightTextColor,
      },
    ['&.shadow']: {
      boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)',
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
  mask?: IconProp;
  transform?: string | Transform;
  src?: string;
  pressed?: boolean;
  mode?: 'active' | 'success' | 'warning' | 'error';
  dark?: boolean;
  chipStyle?: boolean;
  shadow?: boolean;
  loading?: boolean;
}

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.PropsWithChildren<IconButtonProps>
>(
  (
    {
      onClick,
      disabled,
      loading,
      readOnly,
      noHover,
      className,
      style,
      tabIndex,
      tooltip,
      type,
      id,
      icon,
      mask,
      transform,
      src,
      pressed,
      mode: buttonModes,
      dark,
      chipStyle,
      shadow,
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
          classOrNothing('chip', chipStyle) +
          classOrNothing('shadow', shadow) +
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
        <div className={loading ? loadingStyle : internalButtonStyle}>
        {<IconComp icon={icon} mask={mask} transform={transform}/>}
        {src && <img alt={tooltip} src={src} />}
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
