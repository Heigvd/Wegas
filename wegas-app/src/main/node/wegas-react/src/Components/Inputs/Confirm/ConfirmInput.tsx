import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  flex,
  flexColumn,
  flexRow,
  itemCenter,
  justifyCenter,
  layoutStyle,
} from '../../../css/classes';
import { MessageString } from '../../MessageString';
import { themeVar } from '../../Theme/ThemeVars';
import { Button } from '../Buttons/Button';

const newModeStyle = css({
  borderColor: themeVar.colors.PrimaryColor,
  borderRadius: themeVar.dimensions.BorderRadius,
  borderWidth: themeVar.dimensions.BorderWidth,
  borderStyle: 'solid',
  padding: themeVar.dimensions.BorderWidth,
});

export type ButtonsOrientation = 'vertical' | 'horizontal';

export interface ConfrimInputProps {
  onAccept: () => void;
  onCancel: () => void;
  tooltip?: string;
  error?: string;
  disabled?: boolean;
  orientation?: ButtonsOrientation;
}

export function ConfirmInput({
  onAccept,
  onCancel,
  tooltip,
  error,
  disabled,
  orientation = 'vertical',
  children,
}: React.PropsWithChildren<ConfrimInputProps>) {
  return (
    <div
      className={cx(
        flex,
        orientation === 'vertical' ? flexColumn : flexRow,
        newModeStyle,
        justifyCenter,
        itemCenter,
        layoutStyle,
      )}
    >
      {error && <MessageString type="warning" value={error} />}
      {children}
      <div className={cx(flex, flexRow)}>
        <Button
          icon="save"
          disabled={error != null || disabled}
          tooltip={tooltip}
          onClick={onAccept}
        />
        <Button icon="times" tooltip={'cancel'} onClick={onCancel} />
      </div>
    </div>
  );
}
