import * as React from 'react';
import { IconButtonProps, IconButton, shapeStyle } from './IconButton';
import { themeVar } from '../Theme';
import { omit } from 'lodash';
import { useOnClickOutside } from '../Hooks/useOnClickOutside';

interface ConfirmButtonProps {
  onAction?: (success: boolean) => void;
  onBlur?: () => void;
  defaultConfirm?: boolean;
}

export function ConfirmButton(props: ConfirmButtonProps & IconButtonProps) {
  const [confirmation, setConfirmation] = React.useState(props.defaultConfirm);
  const confirmButton = React.useRef(null);

  useOnClickOutside(confirmButton, () => props.onBlur && props.onBlur());

  return !confirmation ? (
    <IconButton
      {...omit(props, ['onAction', 'onBlur', 'defaultConfirm'])}
      onClick={event => {
        event.stopPropagation();
        props.onClick && props.onClick(event);
        setConfirmation(true);
      }}
    />
  ) : (
    <div
      ref={confirmButton}
      style={{
        margin: '5px',
        backgroundColor: 'lightgrey',
        textAlign: 'center',
      }}
    >
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
