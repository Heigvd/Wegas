import { cx } from 'emotion';
import * as React from 'react';
import { Icon, IconComp } from '../../Editor/Components/Views/FontAwesome';
import { Text } from '../Outputs/Text';
import { FlowLine, Process } from './FlowChart';
import { FlowLineProps, CustomFlowLineComponent } from './FlowLineComponent';
import { ProcessProps, CustomProcessComponent } from './ProcessComponent';
import {
  indexTagStyle,
  stateBoxStyle,
  StateProcessHandle,
} from './StateProcessComponent';
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

interface PlayerFlowChartProcessBoxProps<
  F extends LabeledFlowLine,
  P extends LabeledProcess<F>
> extends ClassStyleId {
  process: P;
}

function PlayerFlowChartProcessBox<
  F extends LabeledFlowLine,
  P extends LabeledProcess<F>
>({ process, className, style, id }: PlayerFlowChartProcessBoxProps<F, P>) {
  return (
    <div className={cx(stateBoxStyle, className)} style={style} id={id}>
      {process.icon && (
        <div className={indexTagStyle}>
          <p>
            <IconComp icon={process.icon} />
          </p>
        </div>
      )}
      <div>
        <p className="StateLabelTextStyle">
          <Text text={process.label} />
        </p>
      </div>
      <StateProcessHandle sourceProcess={process} />
    </div>
  );
}

export function PlayerFlowChartProcessComponent<
  F extends LabeledFlowLine,
  P extends LabeledProcess<F>
>(props: ProcessProps<F, P>) {
  return (
    <CustomProcessComponent {...props}>
      {process => <PlayerFlowChartProcessBox process={process} />}
    </CustomProcessComponent>
  );
}
