import * as React from 'react';
import { css, cx } from 'emotion';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';
import { Props } from '@fortawesome/react-fontawesome';

interface IconButtonProps extends Props {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  id?: string;
  tooltip?: string;
  tabIndex?: number;
  prefixedLabel?: boolean;
}
const activeStyle = css({ opacity: 1 });

const shapeStyle = css({
  width: 'auto',
  margin: '3px',
  background: 'none',
  border: 'none',
  fontFamily: 'initial',
  fontSize: 'initial',
  cursor: 'pointer',
  // minWidth: '16px',
  // height: '16px',
  textAlign: 'center',
  display: 'inline-block',
  color: 'inherit',
  opacity: 0.5,
  ':hover,:focus': {
    opacity: 0.8,
    outline: 'none',
  },
});

const disabledStyle = css({
  opacity: 0.5,
  backgroundColor: 'darkslategrey',
});

export function IconButton(props: IconButtonProps) {
  const {
    onClick,
    onMouseDown,
    disabled,
    tooltip,
    tabIndex,
    pressed,
    label,
    prefixedLabel,
    id,
    className,
    ...other
  } = props;
  return (
    <button
      id={id}
      title={tooltip}
      tabIndex={tabIndex}
      aria-label={tooltip}
      // role="button"
      // tabIndex={0}
      aria-pressed={pressed}
      onClick={onClick != null ? event => !disabled && onClick(event) : onClick}
      onMouseDown={
        onMouseDown != null
          ? event => !disabled && onMouseDown(event)
          : onMouseDown
      }
      className={cx(
        shapeStyle,
        {
          [disabledStyle]: Boolean(disabled),
          [activeStyle]: Boolean(pressed),
        },
        className,
      )}
    >
      {prefixedLabel && label}
      <FontAwesome {...other} />
      {!prefixedLabel && label}
    </button>
  );
}
