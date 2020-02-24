import * as React from 'react';
import { css, cx } from 'emotion';
import { Icons, IconComp } from '../../../Editor/Components/Views/FontAwesome';
import { themeVar } from '../../Theme';

export interface IconButtonProps /*extends Props*/ {
  icon: Icons;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseMove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  id?: string;
  tooltip?: string;
  tabIndex?: number;
  prefixedLabel?: boolean;
  type?: 'submit' | 'reset';
  className?: string;
  ref?: React.ClassAttributes<HTMLButtonElement>['ref'];
}
const defaultActiveStyle = css({ color: themeVar.primaryDarkerColor });

export const shapeStyle = css({
  width: 'auto',
  margin: '3px',
  background: 'none',
  border: 'none',
  fontFamily: 'initial',
  fontSize: 'initial',
  cursor: 'pointer',
  textAlign: 'center',
  display: 'inline-block',
  color: themeVar.primaryColor,
  ':hover,:focus': {
    color: themeVar.primaryLighterColor,
    outline: 'none',
  },
});

const disabledStyle = css({
  color: themeVar.disabledColor,
  cursor: 'not-allowed',
  ':hover,:focus': {
    color: themeVar.disabledColor,
  },
});

export const IconButton: React.FunctionComponent<IconButtonProps> = (
  props: IconButtonProps,
) => {
  const {
    onClick,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    disabled,
    tooltip,
    tabIndex,
    pressed,
    label,
    prefixedLabel,
    id,
    type,
    className,
    icon,
    ref,
  } = props;

  return (
    <button
      ref={ref}
      id={id}
      type={type}
      title={tooltip}
      tabIndex={tabIndex}
      aria-label={tooltip}
      aria-pressed={pressed}
      onClick={onClick != null ? event => !disabled && onClick(event) : onClick}
      onMouseDown={
        onMouseDown != null
          ? event => !disabled && onMouseDown(event)
          : onMouseDown
      }
      onMouseUp={
        onMouseUp != null ? event => !disabled && onMouseUp(event) : onMouseUp
      }
      onMouseMove={
        onMouseMove != null
          ? event => !disabled && onMouseMove(event)
          : onMouseMove
      }
      className={cx(shapeStyle, className, {
        [disabledStyle]: Boolean(disabled),
        [defaultActiveStyle]: Boolean(pressed),
      })}
    >
      {prefixedLabel && label}
      <IconComp icon={icon} />
      {!prefixedLabel && label}
    </button>
  );
};
