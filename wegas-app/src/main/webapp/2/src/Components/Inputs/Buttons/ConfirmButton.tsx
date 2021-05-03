import * as React from 'react';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import {
  Button,
  ButtonProps,
  disableBorderToSelector,
} from './Button';
import { classNameOrEmpty } from '../../../Helper/className';
import { css, cx } from 'emotion';
import { inlineFlex } from '../../../css/classes';
import { themeVar } from '../../Style/ThemeVars';

const confirmButtonsContainerStyle = css({
display: 'flex',
backgroundColor: themeVar.Common.colors.BackgroundColor,
button: {
  margin: '4px'
},
borderRadius: themeVar.Common.dimensions.BorderRadius,
boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)',
'&:before': {
  content: "''",
  width: 0,
  height: 0,
  borderRight: '15px solid ' + themeVar.Common.colors.BackgroundColor,
  borderTop: '10px solid transparent',
  borderBottom: '10px solid transparent',
  position: 'relative',
  left: '-13px',
  top: '25%',
  marginRight: '-13px',
}
})

interface ConfirmButtonProps extends ButtonProps {
  onAction?: (
    success: boolean,
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => void;
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
  readOnly,
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
      onAction && onAction(accept, event);
      setConfirmation(defaultConfirm);
    },
    [defaultConfirm, onAction, onClick],
  );

  return (
    <div tabIndex={tabIndex} ref={confirmButton} id={id} className={cx(className, inlineFlex)}>
      <Button
        label={label}
        prefixedLabel={prefixedLabel}
        icon={icon}
        onClick={onClickVerify}
        disableBorders={disableBorders}
        tooltip={tooltip}
        disabled={confirmation || disabled}
        readOnly={readOnly}
        noHover={noHover}
        className={buttonClassName}
      />
      {confirmation &&
        <div
        ref={confirmButton}
        tabIndex={tabIndex}
        id={id}
        className={
          `wegas wegas-btn confirmBtn ${confirmButtonsContainerStyle}` +
          disableBorderToSelector(disableBorders) +
          classNameOrEmpty(className)
        }
      >
        <Button
          label="Cancel"
          onClick={onConfirm(false)}
          disabled={disabled}
          readOnly={readOnly}
          noHover={noHover != null ? noHover : true}
          dark
          className={css({border: '1px solid ' + themeVar.Common.colors.PrimaryColor})}
        />
        <Button
          label="Accept"
          onClick={onConfirm(true)}
          disabled={disabled}
          readOnly={readOnly}
          noHover={noHover != null ? noHover : true}
          type={type}
        />
      </div>}
    </div>
  );
}
