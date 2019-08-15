import * as React from 'react';
import { IconButtonProps, IconButton, shapeStyle } from './IconButton';
import { themeVar } from '../Theme';
import { useOnClickOutside } from '../Hooks/useOnClickOutside';
import { css } from 'emotion';

const buttonZone = css({
  margin: '5px',
  backgroundColor: 'lightgrey',
  textAlign: 'center',
  display: 'inline-block',
});

interface ConfirmButtonProps {
  onAction?: (success: boolean) => void;
  onBlur?: () => void;
  defaultConfirm?: boolean;
  dontResetOnBlur?: boolean;
}

export function ConfirmButton(props: ConfirmButtonProps & IconButtonProps) {
  const [confirmation, setConfirmation] = React.useState(props.defaultConfirm);
  const confirmButton = React.useRef(null);

  useOnClickOutside(confirmButton, () => {
    if (!props.dontResetOnBlur) {
      setConfirmation(false);
    }
    if (props.onBlur) {
      props.onBlur();
    }
  });

  return !confirmation ? (
    <IconButton
      {...props as IconButtonProps}
      onClick={event => {
        event.stopPropagation();
        props.onClick && props.onClick(event);
        setConfirmation(true);
      }}
    />
  ) : (
    <div ref={confirmButton} className={buttonZone}>
      {props.label}
      <button
        style={{
          backgroundColor: themeVar.warningColor,
          color: themeVar.primaryDarkerTextColor,
        }}
        className={shapeStyle}
        onClick={event => {
          event.stopPropagation();
          props.onAction && props.onAction(true);
          setConfirmation(props.defaultConfirm);
        }}
      >
        Accept
      </button>
      <button
        style={{
          backgroundColor: themeVar.primaryDarkerColor,
          color: themeVar.primaryDarkerTextColor,
        }}
        className={shapeStyle}
        onClick={event => {
          event.stopPropagation();
          props.onAction && props.onAction(false);
          setConfirmation(props.defaultConfirm);
        }}
      >
        Cancel
      </button>
    </div>
  );
}
