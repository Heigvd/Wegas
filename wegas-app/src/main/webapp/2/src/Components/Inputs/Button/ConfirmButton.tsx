import * as React from 'react';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import { css } from 'emotion';
import { themeVar } from '../../Theme';
import { Icon } from '../../../Editor/Components/Views/FontAwesome';
import { DisableBorders, disableBordersCSS, Button } from '../Buttons/Button';
import { IconButton } from '../Buttons/IconButton';

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
  disabled?: boolean;
  className?: string;
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
    <div className={props.className}>
      {props.label && (
        <Button
          label={props.label}
          onClick={onClick}
          disableBorders={props.disableBorders}
          tooltip={props.tooltip}
          disabled={props.disabled}
        />
      )}
      {props.icon && (
        <IconButton
          icon={props.icon}
          onClick={onClick}
          tooltip={props.tooltip}
          disabled={props.disabled}
        />
      )}
    </div>
  ) : (
    <div
      ref={confirmButton}
      className={buttonZone(props.disableBorders) + ' ' + props.className}
    >
      <Button
        label="Accept"
        noHover
        className={css({ backgroundColor: themeVar.warningColor })}
        disableBorders={{ right: true }}
        onClick={event => {
          event.stopPropagation();
          props.onAction && props.onAction(true);
          setConfirmation(props.defaultConfirm);
        }}
        disabled={props.disabled}
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
        disabled={props.disabled}
      />
    </div>
  );
}
