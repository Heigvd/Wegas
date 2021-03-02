import { cx } from 'emotion';
import * as React from 'react';
import { Icon, IconComp } from '../../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../../Helper/className';
import { Text } from '../Outputs/Text';
import { isActionAllowed } from '../PageComponents/tools/options';
import { FlowLine, Process } from './FlowChart';
import { FlowLineProps, CustomFlowLineComponent } from './FlowLineComponent';
import { ProcessProps, CustomProcessComponent } from './ProcessComponent';
import {
  indexTagStyle,
  stateBoxActionStyle,
  stateBoxStyle,
  StateProcessHandle,
} from './StateProcessComponent';
import {
  transitionBoxActionStyle,
  transitionBoxStyle,
} from './TransitionFlowLineComponent';

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
            className={cx(transitionBoxStyle, {
              [transitionBoxActionStyle]: isActionAllowed({
                readOnly: props.readOnly,
                disabled: props.disabled,
              }),
            })}
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
  disabled?: boolean;
  readOnly?: boolean;
}

function PlayerFlowChartProcessBox<
  F extends LabeledFlowLine,
  P extends LabeledProcess<F>
>({
  process,
  className,
  style,
  id,
  disabled,
  readOnly,
}: PlayerFlowChartProcessBoxProps<F, P>) {
  return (
    <div
      className={
        cx(stateBoxStyle, {
          [stateBoxActionStyle]: isActionAllowed({
            disabled: disabled,
            readOnly: readOnly,
          }),
        }) +
        classNameOrEmpty(className) +
        classNameOrEmpty(process.className)
      }
      style={{ ...style, ...process.style }}
      id={id}
    >
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
      {process => (
        <PlayerFlowChartProcessBox
          process={process}
          disabled={props.disabled}
          readOnly={props.readOnly}
        />
      )}
    </CustomProcessComponent>
  );
}
