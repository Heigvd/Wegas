import * as React from 'react';
import { css, cx } from 'emotion';
import { Icons, IconComp } from '../../../Editor/Components/Views/FontAwesome';
import { CommonButtonProps } from './Button';
import { themeVar } from '../../Style/ThemeVars';

export interface IconButtonProps extends CommonButtonProps {
  icon: Icons;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseMove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  pressed?: boolean;
  prefixedLabel?: boolean;
  // ref?: React.ClassAttributes<HTMLButtonElement>['ref'];
}
const defaultActiveStyle = css({
  color: themeVar.Button.colors.IconButtonActiveColor,
});

export const shapeStyle = css({
  width: 'auto',
  margin: '3px',
  background: 'none',
  border: 'none',
  fontFamily: 'initial',
  fontSize: 'initial',
  cursor: 'pointer',
  textAlign: 'center',
  // display: 'inline-block',
  ':hover': {
    outline: 'none',
  },
});

const colorStyle = (noHover?: boolean) =>
  css({
    color: themeVar.Button.colors.Color,
    ':hover': {
      color: noHover ? undefined : themeVar.Button.colors.HoverColor,
    },
  });

const noClickStyle = css({
  cursor: 'inherit',
});

const disabledStyle = css({
  color: themeVar.Button.colors.DisabledColor,
  cursor: 'initial',
  ':hover': {
    color: themeVar.Button.colors.DisabledColor,
  },
});

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
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
      noHover,
      // ref,
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
        onClick={
          onClick != null ? event => !disabled && onClick(event) : onClick
        }
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
        className={cx(shapeStyle, className ? className : colorStyle(noHover), {
          [noClickStyle]: !onClick && !onMouseDown && !onMouseUp,
          [disabledStyle]: Boolean(disabled),
          [defaultActiveStyle]: Boolean(pressed),
        })}
      >
        {prefixedLabel && label}
        <IconComp icon={icon} />
        {!prefixedLabel && label}
      </button>
    );
  },
);
