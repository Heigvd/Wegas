import * as React from 'react';
import { IconButton } from './IconButton';
import { useOnClickOutside } from '../Hooks/useOnClickOutside';
import { css } from 'emotion';
import { Button, DisableBorders, disableBordersCSS } from './Button';
import { themeVar } from '../Theme';
import { Icon } from '../../Editor/Components/Views/FontAwesome';

const buttonZone = (disableBorders?: DisableBorders) =>
  css({
    // margin: '5px',
    padding: '5px',
    ...disableBordersCSS(disableBorders),
    backgroundColor: themeVar.disabledColor,
    textAlign: 'center',
    display: 'inline-block',
    width: 'max-content',
  });

interface ConfirmButtonProps {
  label?: React.ReactNode;
  icon?: Icon;
  tooltip?: string;
  onAction?: (success: boolean) => void;
  onBlur?: () => void;
  defaultConfirm?: boolean;
  dontResetOnBlur?: boolean;
  disableBorders?: DisableBorders;
}

export function ConfirmButton(props: ConfirmButtonProps /*& IconButtonProps*/) {
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

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      setConfirmation(true);
    },
    [],
  );

  return !confirmation ? (
    <>
      {props.label && (
        <Button
          label={props.label}
          onClick={onClick}
          disableBorders={props.disableBorders}
          tooltip={props.tooltip}
        />
      )}
      {props.icon && (
        <IconButton
          icon={props.icon}
          onClick={onClick}
          tooltip={props.tooltip}
        />
      )}
    </>
  ) : (
    <div ref={confirmButton} className={buttonZone(props.disableBorders)}>
      <Button
        label="Accept"
        noHover
        style={{ backgroundColor: themeVar.warningColor }}
        disableBorders={{ right: true }}
        onClick={event => {
          event.stopPropagation();
          props.onAction && props.onAction(true);
          setConfirmation(props.defaultConfirm);
        }}
      />
      <Button
        label="Cancel"
        noHover
        disableBorders={{ left: true }}
        onClick={event => {
          event.stopPropagation();
          props.onAction && props.onAction(false);
          setConfirmation(props.defaultConfirm);
        }}
      />
    </div>
  );
}
