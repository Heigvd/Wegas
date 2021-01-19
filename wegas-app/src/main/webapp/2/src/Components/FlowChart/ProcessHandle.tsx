import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../Style/ThemeVars';
import { useDrag } from 'react-dnd';
import { Process } from './FlowChart';

export const PROCESS_HANDLE_DND_TYPE = 'DND_PROCESS_HANDLE';

export interface DnDFlowchartHandle {
  type: typeof PROCESS_HANDLE_DND_TYPE;
  sourceProcess: Process;
}

export const HANDLE_SIDE = 20;

const flowHandleStyle = css({
  position: 'absolute',
  zIndex: 1,
  width: `${HANDLE_SIDE}px`,
  height: `${HANDLE_SIDE}px`,
  borderRadius: `${HANDLE_SIDE / 2}px`,
  backgroundColor: themeVar.Common.colors.WarningColor,
  opacity: 0.4,
  ':hover': { opacity: 1 },
});

interface ProcessHandleProps {
  sourceProcess: Process;
}

export function ProcessHandle({ sourceProcess }: ProcessHandleProps) {
  const [, drag] = useDrag<DnDFlowchartHandle, unknown, unknown>({
    item: {
      type: PROCESS_HANDLE_DND_TYPE,
      sourceProcess,
    },
  });

  return (
    <div
      ref={drag}
      style={{
        right: `${-HANDLE_SIDE / 2}px`,
        top: `calc(50% - ${HANDLE_SIDE / 2}px)`,
      }}
      className={flowHandleStyle}
    />
  );
}
