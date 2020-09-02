import * as React from 'react';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import { Button, ButtonProps, disableBorderToSelector } from './Button';
import { classNameOrEmpty } from '../../../Helper/className';

interface ConfirmButtonProps extends ButtonProps {
  onAction?: (success: boolean) => void;
  onBlur?: () => void;
  defaultConfirm?: boolean;
  dontResetOnBlur?: boolean;
  buttonClassName?: string;
}

export function ConfirmButton({
  label,
  icon,
  prefixedLabel,
  onClick,
  onAction,
  onBlur,
  defaultConfirm,
  dontResetOnBlur,
  disabled,
  noHover,
  disableBorders,
  className,
  buttonClassName,
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
      <Button
        label={label}
        prefixedLabel={prefixedLabel}
        icon={icon}
        onClick={onClickVerify}
        disableBorders={disableBorders}
        tooltip={tooltip}
        disabled={disabled}
        noHover={noHover}
        className={buttonClassName}
      />
    </div>
  ) : (
    <div
      ref={confirmButton}
      tabIndex={tabIndex}
      id={id}
      className={
        'wegas wegas-btn confirmBtn ' +
        disableBorderToSelector(disableBorders) +
        classNameOrEmpty(className)
      }
    >
      <Button
        label="Accept"
        mode="warning"
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
