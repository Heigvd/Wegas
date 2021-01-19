import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../Style/ThemeVars';
import { useDrag } from 'react-dnd';
import { FlowLine, Process } from './FlowChart';

export const PROCESS_HANDLE_DND_TYPE = 'DND_PROCESS_HANDLE';

export interface DnDFlowchartHandle<F extends FlowLine, P extends Process<F>> {
  type: typeof PROCESS_HANDLE_DND_TYPE;
  sourceProcess: P;
  flowline?: F;
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
  cursor: 'move',
  ':hover': { opacity: 1 },
});

export interface ProcessHandleProps<F extends FlowLine, P extends Process<F>> {
  /**
   * the process from which the flowline is comming
   */
  sourceProcess: P;
  /**
   * the flowline object to drag (if already existing)
   */
  flowline?: F;
}

export function DefaultProcessHandle<F extends FlowLine, P extends Process<F>>({
  sourceProcess,
  flowline,
}: ProcessHandleProps<F, P>) {
  const [, drag] = useDrag<DnDFlowchartHandle<F, P>, unknown, unknown>({
    item: {
      type: PROCESS_HANDLE_DND_TYPE,
      sourceProcess,
      flowline,
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
      data-nodrag={true}
    />
  );
}
