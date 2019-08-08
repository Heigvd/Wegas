import * as React from 'react';
import { IconButtonProps, IconButton, shapeStyle } from './IconButton';
import { themeVar } from '../Theme';

export function ConfirmButton(props: IconButtonProps) {
  const [confirmation, setConfirmation] = React.useState(true);
  const onConfirm = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    setConfirmation(false);
  };

  return confirmation ? (
    <IconButton {...props} onClick={onConfirm} />
  ) : (
    <>
      <button
        style={{
          backgroundColor: themeVar.warningColor,
          color: themeVar.primaryDarkerTextColor,
        }}
        className={shapeStyle}
        onClick={e => {
          setConfirmation(true);
          props.onClick && props.onClick(e);
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
        onClick={() => setConfirmation(true)}
      >
        Cancel
      </button>
    </>
  );
}
