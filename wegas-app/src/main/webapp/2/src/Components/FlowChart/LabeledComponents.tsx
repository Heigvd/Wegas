import * as React from 'react';
import { Icon, IconComp } from '../../Editor/Components/Views/FontAwesome';
import { Text } from '../Outputs/Text';
import { FlowLine, Process } from './FlowChart';
import { FlowLineProps, CustomFlowLineComponent } from './FlowLineComponent';
import { ProcessProps, CustomProcessComponent } from './ProcessComponent';
import { stateBoxStyle } from './StateProcessComponent';
import { transitionBoxStyle } from './TransitionFlowLineComponent';

export interface LabeledFlowLine extends FlowLine {
  label?: string;
}

export interface LabeledProcess<F extends LabeledFlowLine> extends Process<F> {
  label: string;
  icon?: Icon;
}

export function LabeledFlowLineComponent<
  F extends LabeledFlowLine,
  P extends LabeledProcess<F>
>(props: FlowLineProps<F, P>) {
  return (
    <CustomFlowLineComponent {...props}>
      {(flowline, startProcess, onClick) =>
        flowline.label && (
          <div
            onClick={e => onClick && onClick(e, startProcess, flowline)}
            className={transitionBoxStyle}
          >
            <Text text={flowline.label} />
          </div>
        )
      }
    </CustomFlowLineComponent>
  );
}

export function LabeledProcessComponent<
  F extends LabeledFlowLine,
  P extends LabeledProcess<F>
>(props: ProcessProps<F, P>) {
  return (
    <CustomProcessComponent {...props}>
      {(process, onClick) => (
        <div
          className={stateBoxStyle}
          onClick={e => {
            onClick && onClick(e, process);
          }}
        >
          {process.icon && <IconComp icon={process.icon} />}
          <Text text={process.label} />
        </div>
      )}
    </CustomProcessComponent>
  );
}
