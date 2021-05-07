import { css, cx } from 'emotion';
import * as React from 'react';
import { componentMarginLeft, flex, itemCenter } from '../../../../css/classes';
import { Theme } from '../../ThemeVars';
import { borderStyle } from '../Theme/ColorPicker';

const modeColorSelectorSample = cx(
  css({
    ...borderStyle,
    borderWidth: '2px',
    minWidth: '12px',
    minHeight: '12px',
  }),
  componentMarginLeft,
);

interface ModeColorValueProps {
  label?: string;
  theme: Theme;
}

export function ModeColorValue({ label, theme }: ModeColorValueProps) {
  return (
    <div className={cx(flex, itemCenter)}>
      {label}
      <div
        className={modeColorSelectorSample}
        style={{
          backgroundColor: label ? theme.values.colors[label] : undefined,
        }}
      ></div>
    </div>
  );
}
