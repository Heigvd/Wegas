import * as React from 'react';
import { IconButton } from './IconButton';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import { css } from 'emotion';
import {
  Button,
  DisableBorders,
  disableBordersCSS,
  ButtonProps,
} from './Button';
import { Icon } from '../../../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../../../Helper/className';
import { themeVar } from '../../Style/ThemeVars';

const buttonZone = (disableBorders?: DisableBorders) =>
  css({
    // margin: '5px',
    padding: '5px',
    ...disableBordersCSS(disableBorders),
    backgroundColor: themeVar.Button.colors.ConfirmButtonZoneColor,
    textAlign: 'center',
    display: 'inline-block',
    width: 'max-content',
  });

interface ConfirmButtonProps extends ButtonProps {
  icon?: Icon;
  onAction?: (success: boolean) => void;
  onBlur?: () => void;
  defaultConfirm?: boolean;
  dontResetOnBlur?: boolean;
  disableBorders?: DisableBorders;
}

export function ConfirmButton({
  label,
  icon,
  onClick,
  onAction,
  onBlur,
  defaultConfirm,
  dontResetOnBlur,
  disabled,
  noHover,
  disableBorders,
  className,
  tabIndex,
  tooltip,
  type,
  id,
}: ConfirmButtonProps) {
  const [confirmation, setConfirmation] = React.useState(defaultConfirm);
  const confirmButton = React.useRef(null);

  useOnClickOutside(confirmButton, () => {
    if (!dontResetOnBlur) {
      setConfirmation(false);
    }
    if (onBlur) {
      onBlur();
    }
  });

  const onClickVerify = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();
      onClick && onClick(event);
      setConfirmation(true);
    },
    [onClick],
  );

  const onConfirm = React.useCallback(
    (accept: boolean) => (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      event.stopPropagation();
      onClick && onClick(event);
      onAction && onAction(accept);
      setConfirmation(defaultConfirm);
    },
    [defaultConfirm, onAction, onClick],
  );

  return !confirmation ? (
    <div tabIndex={tabIndex} ref={confirmButton} id={id} className={className}>
      {label && (
        <Button
          label={label}
          onClick={onClickVerify}
          disableBorders={disableBorders}
          tooltip={tooltip}
          disabled={disabled}
          noHover={noHover}
        />
      )}
      {icon && (
        <IconButton
          icon={icon}
          onClick={onClickVerify}
          tooltip={tooltip}
          disabled={disabled}
          noHover={noHover}
        />
      )}
    </div>
  ) : (
    <div
      ref={confirmButton}
      tabIndex={tabIndex}
      id={id}
      className={buttonZone(disableBorders) + classNameOrEmpty(className)}
    >
      <Button
        label="Accept"
        className={css({
          backgroundColor: themeVar.Button.colors.ConfirmButtonAcceptColor,
        })}
        disableBorders={{ right: true }}
        onClick={onConfirm(true)}
        disabled={disabled}
        noHover={noHover != null ? noHover : true}
        type={type}
      />
      <Button
        label="Cancel"
        disableBorders={{ left: true }}
        onClick={onConfirm(false)}
        disabled={disabled}
        noHover={noHover != null ? noHover : true}
      />
    </div>
  );
}
