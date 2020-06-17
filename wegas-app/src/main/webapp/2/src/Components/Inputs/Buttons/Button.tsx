import * as React from 'react';
import { css, cx } from 'emotion';
import { CSSProperties } from 'react';
import { classNameOrEmpty } from '../../../Helper/className';
import { themeVar } from '../../Style/ThemeVars';
import { ThemeComponent, useModeSwitch } from '../../Style/Theme';

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

export const disableBordersCSS = (
  disableBorders?: DisableBorders,
): CSSProperties => ({
  borderTopLeftRadius:
    disableBorders &&
    (disableBorders.topLeft || disableBorders.left || disableBorders.top)
      ? undefined
      : themeVar.Common.dimensions.BorderRadius,
  borderTopRightRadius:
    disableBorders &&
    (disableBorders.topRight || disableBorders.right || disableBorders.top)
      ? undefined
      : themeVar.Common.dimensions.BorderRadius,
  borderBottomLeftRadius:
    disableBorders &&
    (disableBorders.bottomLeft || disableBorders.left || disableBorders.bottom)
      ? undefined
      : themeVar.Common.dimensions.BorderRadius,
  borderBottomRightRadius:
    disableBorders &&
    (disableBorders.bottomRight ||
      disableBorders.right ||
      disableBorders.bottom)
      ? undefined
      : themeVar.Common.dimensions.BorderRadius,
});

export const buttonStyle = (
  disabled?: boolean,
  noHover?: boolean,
  disableBorders?: DisableBorders,
  noClick?: boolean,
) =>
  css({
    backgroundColor: disabled
      ? themeVar.Common.colors.DisabledColor
      : themeVar.Common.colors.MainColor,
    color: themeVar.Common.colors.SecondaryTextColor,
    borderStyle: 'none',
    ...disableBordersCSS(disableBorders),
    paddingLeft: '5px',
    paddingRight: '5px',
    paddingTop: '2px',
    paddingBottom: '2px',
    cursor: disabled ? 'initial' : noClick ? 'inherit' : 'pointer',
    fontFamily: themeVar.Common.others.TextFont2,
    ':hover':
      disabled || noHover
        ? undefined
        : {
            color: themeVar.Common.colors.HoverTextColor,
            backgroundColor: themeVar.Common.colors.ActiveColor,
            outline: 'none',
          },
    ':focus': {
      outline: 'none',
    },
  });

export interface CommonButtonProps extends ClassAndStyle {
  label?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  disabled?: boolean;
  tabIndex?: number;
  tooltip?: string;
  noHover?: boolean;
  type?: 'submit' | 'reset' | 'button';
  id?: string;
}

export interface ButtonProps extends CommonButtonProps {
  disableBorders?: DisableBorders;
}

export function Button({
  label,
  onClick,
  disabled,
  noHover,
  disableBorders,
  className,
  style,
  children,
  tabIndex,
  tooltip,
  type,
  id,
}: React.PropsWithChildren<ButtonProps>) {
  return (
    <button
      id={id}
      className={
        classNameOrEmpty(className) +
        cx(buttonStyle(disabled, noHover, disableBorders, onClick == null))
      }
      style={style}
      onClick={onClick}
      disabled={disabled}
      tabIndex={tabIndex}
      title={tooltip}
      type={type}
    >
      {label}
      {children}
    </button>
  );
}

export function SwitchingModeButton({
  label,
  onClick,
  disabled,
  noHover,
  disableBorders,
  className,
  style,
  children,
  tabIndex,
  tooltip,
  type,
  id,
  modeName,
}: React.PropsWithChildren<ButtonProps & ThemeComponent>) {
  const {
    currentModeClassName,
    childrenModeClassName,
    childrenNode,
    switcher,
  } = useModeSwitch(modeName, children);

  return (
    <button
      ref={switcher}
      id={id}
      className={
        cx(buttonStyle(disabled, noHover, disableBorders, onClick == null)) +
        classNameOrEmpty(currentModeClassName) +
        classNameOrEmpty(childrenModeClassName) +
        classNameOrEmpty(className)
      }
      style={style}
      onClick={onClick}
      disabled={disabled}
      tabIndex={tabIndex}
      title={tooltip}
      type={type}
    >
      {label}
      {childrenNode}
    </button>
  );
}
