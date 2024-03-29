import * as React from 'react';
import { useOnClickOutside } from '../../Hooks/useOnClickOutside';
import { Button, ButtonProps, disableBorderToSelector } from './Button';
import { classNameOrEmpty } from '../../../Helper/className';
import { css, cx } from '@emotion/css';
import { inlineFlex } from '../../../css/classes';
import { IconButton } from './IconButton';
import { themeVar } from '../../Theme/ThemeVars';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';
import { OkCancelModal } from '../../Modal';
const confirmButtonsContainerStyle = css({
  display: 'flex',
  backgroundColor: themeVar.colors.BackgroundColor,
  button: {
    margin: '4px',
  },
  borderRadius: themeVar.dimensions.BorderRadius,
  boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)',
  '&:before': {
    content: "''",
    width: 0,
    height: 0,
    borderRight: '15px solid ' + themeVar.colors.BackgroundColor,
    borderTop: '10px solid transparent',
    borderBottom: '10px solid transparent',
    position: 'relative',
    left: '-13px',
    top: '25%',
    marginRight: '-13px',
  },
});
interface ConfirmButtonProps extends ButtonProps {
  onAction?: (
    success: boolean,
    event?: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => void;
  onBlur?: () => void;
  defaultConfirm?: boolean;
  dontResetOnBlur?: boolean;
  buttonClassName?: string;
  //TODO TO ASK add iconButton props with icon?
  chipStyle?: boolean;
  shadow?: boolean;
  modalDisplay?: boolean;
  modalMessage?: string;
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
  loading,
  noHover,
  disableBorders,
  className,
  buttonClassName,
  chipStyle,
  shadow,
  modalDisplay,
  modalMessage,
  tabIndex,
  tooltip,
  type,
  id,
}: ConfirmButtonProps) {
  const [confirmation, setConfirmation] = React.useState(defaultConfirm);
  const confirmButton = React.useRef(null);
  const i18nValues = useInternalTranslate(commonTranslations);

  useOnClickOutside(confirmButton, () => {
    if (!dontResetOnBlur) {
      setConfirmation(false);
    }
    if (onBlur) {
      onBlur();
    }
  });

  const onClickVerify = React.useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      event.stopPropagation();
      onClick && onClick(event);
      setConfirmation(true);
    },
    [onClick],
  );

  const onConfirm = React.useCallback(
    (accept: boolean) => (event?: React.MouseEvent<HTMLElement, MouseEvent>) => {
      event?.stopPropagation();
      event && onClick && onClick(event);
      onAction && onAction(accept, event);
      setConfirmation(defaultConfirm);
    },
    [defaultConfirm, onAction, onClick],
  );

  return (
    <div
      tabIndex={tabIndex}
      ref={confirmButton}
      id={id}
      className={cx(className, inlineFlex)}
    >
      {icon && !label ? (
        <IconButton
          icon={icon}
          onClick={onClickVerify}
          tooltip={tooltip}
          disabled={confirmation || disabled}
          loading={loading}
          readOnly={readOnly}
          noHover={noHover}
          className={buttonClassName}
          chipStyle={chipStyle && chipStyle}
          shadow={shadow && shadow}
        />
      ) : (
        <Button
          label={label}
          prefixedLabel={prefixedLabel}
          icon={icon}
          onClick={onClickVerify}
          disableBorders={disableBorders}
          tooltip={tooltip}
          disabled={confirmation || disabled}
          loading={loading}
          readOnly={readOnly}
          noHover={noHover}
          className={buttonClassName}
        />
      )}
      {confirmation &&
        (modalDisplay ? (
          <OkCancelModal
            onOk={e => onConfirm(true)(e)}
            onCancel={e => onConfirm(false)(e)}
            unattached={true}
          >
            {modalMessage}
          </OkCancelModal>
        ) : (
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
              label={i18nValues.accept}
              onClick={onConfirm(true)}
              disabled={disabled}
              readOnly={readOnly}
              noHover={noHover != null ? noHover : true}
              type={type}
            />
            <Button
              label={i18nValues.cancel}
              onClick={onConfirm(false)}
              disabled={disabled}
              readOnly={readOnly}
              noHover={noHover != null ? noHover : true}
              dark
            />
          </div>
        ))}
    </div>
  );
}
