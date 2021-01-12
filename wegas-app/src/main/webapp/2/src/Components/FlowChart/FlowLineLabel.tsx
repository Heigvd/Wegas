import { css } from 'emotion';
import * as React from 'react';
import { themeVar } from '../Style/ThemeVars';

const LABEL_WIDTH = 80;
const LABEL_HEIGHT = 35;

export interface FlowLineLabelProps {
  id?: string;
  label?: React.ReactNode;
}

const flowLineLabelStyle = css({
  minWidth: `${LABEL_WIDTH}px`,
  minHeight: `${LABEL_HEIGHT}px`,
  backgroundColor: themeVar.Common.colors.ActiveColor,
  borderRadius: '10px',
  boxShadow: `5px 5px 5px ${themeVar.Common.colors.HeaderColor}`,
  cursor: 'move',
  userSelect: 'none',
  overflow: 'show',
});

export function FlowLineLabelComponent({ id, label }: FlowLineLabelProps) {
  return (
    <div id={id} className={flowLineLabelStyle}>
      {label}
    </div>
  );
}
