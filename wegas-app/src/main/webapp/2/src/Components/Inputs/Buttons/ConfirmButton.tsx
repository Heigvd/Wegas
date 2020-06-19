import * as React from 'react';
import { IconButton } from './IconButton';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import { css, cx } from 'emotion';
import {
  Button,
  DisableBorders,
  disableBordersCSS,
  ButtonProps,
} from './Button';
import { Icon } from '../../../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../../../Helper/className';
import { themeVar } from '../../Style/ThemeVars';
import { flex } from '../../../css/classes';

const buttonZone = (disableBorders?: DisableBorders) =>
  css({
    // margin: '5px',
    padding: '5px',
    ...disableBordersCSS(disableBorders),
    backgroundColor: themeVar.Common.colors.HeaderColor,
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
  buttonClassName?: string;
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
      {icon ? (
        <IconButton
          label={label}
          icon={icon}
          onClick={onClickVerify}
          tooltip={tooltip}
          disabled={disabled}
          noHover={noHover}
          prefixedLabel
          className={buttonClassName}
        />
      ) : (
        <Button
          label={label}
          onClick={onClickVerify}
          disableBorders={disableBorders}
          tooltip={tooltip}
          disabled={disabled}
          noHover={noHover}
          className={buttonClassName}
        />
      )}
    </div>
  ) : (
    <div
      ref={confirmButton}
      tabIndex={tabIndex}
      id={id}
      className={
        cx(buttonZone(disableBorders), flex) + classNameOrEmpty(className)
      }
    >
      <Button
        label="Accept"
        customColor={{ backgroundColor: themeVar.Common.colors.WarningColor }}
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
