import * as React from 'react';
import { css } from 'emotion';
import {
  XYPosition,
  MouseDnDHandler,
  useMouseEventDnd,
} from '../Hooks/useMouseEventDnd';
import { themeVar } from '../Style/ThemeVars';

export const HANDLE_SIDE = 20;

const flowHandleStyle = css({
  position: 'absolute',
  width: `${HANDLE_SIDE}px`,
  height: `${HANDLE_SIDE}px`,
  borderRadius: `${HANDLE_SIDE / 2}px`,
  backgroundColor: themeVar.Common.colors.WarningColor,
  opacity: 0.2,
  ':hover': { opacity: 1 },
});

interface ProcessHandleProps {
  position: XYPosition;
  handlers: MouseDnDHandler;
}

export function ProcessHandle({ position, handlers }: ProcessHandleProps) {
  const handleElement = React.useRef<HTMLDivElement>(null);
  useMouseEventDnd(handleElement, handlers);

  return (
    <div
      ref={handleElement}
      style={{
        left: position.x,
        top: position.y,
      }}
      className={flowHandleStyle}
    />
  );
}
