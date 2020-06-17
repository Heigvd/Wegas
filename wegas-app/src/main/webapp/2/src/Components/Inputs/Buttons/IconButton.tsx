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
  color: themeVar.Common.colors.ActiveColor,
});

export const shapeStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: 'auto',
  margin: '3px',
  background: 'none',
  border: 'none',
  fontSize: 'initial',
  cursor: 'pointer',
  textAlign: 'center',
  // display: 'inline-block',
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  fontFamily: themeVar.Common.others.TextFont2,
  ':hover': {
    outline: 'none',
  },
});

const colorStyle = (noHover?: boolean) =>
  css({
    color: themeVar.Common.colors.TextColor,
    ':hover': {
      color: noHover ? undefined : themeVar.Common.colors.ActiveColor,
    },
  });

const noClickStyle = css({
  cursor: 'inherit',
});

const disabledStyle = css({
  color: themeVar.Common.colors.DisabledColor,
  cursor: 'initial',
  ':hover': {
    color: themeVar.Common.colors.DisabledColor,
  },
});

const labeledStyle = (noHover?: boolean) =>
  css({
    backgroundColor: themeVar.Common.colors.MainColor,
    color: themeVar.Common.colors.SecondaryTextColor,
    ':hover': {
      color: noHover ? undefined : themeVar.Common.colors.HoverTextColor,
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
        className={cx(
          shapeStyle,
          className
            ? className
            : label
            ? labeledStyle(noHover)
            : colorStyle(noHover),
          {
            [noClickStyle]: !onClick && !onMouseDown && !onMouseUp,
            [disabledStyle]: Boolean(disabled),
            [defaultActiveStyle]: Boolean(pressed),
          },
        )}
      >
        {prefixedLabel === true && (
          <div style={{ marginRight: '3px' }}>{label}</div>
        )}
        <IconComp icon={icon} />
        {prefixedLabel === false && (
          <div style={{ marginLeft: '3px' }}>{label}</div>
        )}
      </button>
    );
  },
);
