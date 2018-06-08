import * as React from 'react';
import { css, cx } from 'emotion';
import { FontAwesome } from '../../Editor/Components/Views/FontAwesome';
import { FontAwesomeProps } from '@fortawesome/react-fontawesome';

interface Props extends FontAwesomeProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  id?: string;
  tooltip?: string;
  prefixedLabel?: boolean;
}
const activeStyle = css({ textShadow: '0 0 4px' });

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
  opacity: 0.7,
  ':hover,:focus': {
    opacity: 1,
    outline: 'none',
  },
});

const disabledStyle = css({
  opacity: 0.5,
  backgroundColor: 'darkslategrey',
});

export function IconButton(props: Props) {
  const {
    onClick,
    disabled,
    tooltip,
    pressed,
    label,
    prefixedLabel,
    id,
    ...other
  } = props;
  return (
    <button
      id={id}
      title={tooltip}
      aria-label={tooltip}
      // role="button"
      // tabIndex={0}
      aria-pressed={pressed}
      onClick={event => !disabled && onClick(event)}
      className={cx(shapeStyle, {
        [disabledStyle]: Boolean(disabled),
        [activeStyle]: Boolean(pressed),
      })}
    >
      {prefixedLabel && label}
      <FontAwesome {...other} />
      {!prefixedLabel && label}
    </button>
  );
}
