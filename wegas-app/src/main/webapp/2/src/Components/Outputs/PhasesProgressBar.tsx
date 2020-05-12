import * as React from 'react';
import {
  centeredContent,
  textCenter,
  flexColumn,
  grow,
  flex,
  flexDistribute,
  itemCenter,
} from '../../css/classes';
import { Value } from './Value';
import { cx, css } from 'emotion';
import { IconComp } from '../../Editor/Components/Views/FontAwesome';
import { themeVar } from '../Theme';
import { classNameOrEmpty } from '../../Helper/className';

const phasePathStyle = css({
  height: '0.5em',
  backgroundColor: themeVar.disabledColor,
});

const phaseDotStyle = css({
  borderRadius: '50%',
  borderStyle: 'solid',
  borderWidth: '5px',
  borderColor: themeVar.disabledColor,
});

interface PhaseComponentProps {
  /**
   * value - the current value of the progess bar
   */
  value: number;
  /**
   * phase - the phase of the component
   */
  phase: number;
}

function SimplePhaseComponent({ value, phase }: PhaseComponentProps) {
  return (
    <div className={phaseDotStyle}>
      <IconComp
        icon={{
          icon: phase < value ? 'check-circle' : 'dot-circle',
          fixedWidth: false,
          size: 'lg',
          color:
            phase < value
              ? themeVar.primaryColor
              : phase > value
              ? 'transparent'
              : themeVar.primaryDarkerColor,
        }}
      />
    </div>
  );
}

function SimpleInterPhaseComponent(_props: PhaseComponentProps) {
  return <div className={cx(phasePathStyle, grow)}></div>;
}

function drawBar(
  phaseMin: number,
  phaseMax: number,
  value: number,
  PhaseComponent: React.FunctionComponent<PhaseComponentProps>,
  InterPhaseComponent: React.FunctionComponent<PhaseComponentProps>,
) {
  const content: JSX.Element[] = [];

  for (let i = phaseMin; i <= phaseMax; i++) {
    if (i > phaseMin) {
      content.push(
        <InterPhaseComponent value={value} phase={i} key={'INTER' + i} />,
      );
    }
    content.push(<PhaseComponent value={value} phase={i} key={'PHASE' + i} />);
  }
  return (
    <div className={cx(flex, grow, flexDistribute, itemCenter)}>{content}</div>
  );
}

export interface PhasesProgressBarProps extends ClassAndStyle {
  /**
   * value - the current value of the progess bar
   */
  value: number;
  /**
   * phaseMin - the value of the first phase
   */
  phaseMin: number;
  /**
   * phaseMax - the value of the last phase
   */
  phaseMax: number;
  /**
   * label - The label to display with the gauge
   */
  label?: string;
  /**
   * displayValue - should the current value be displayed with the gauge
   */
  displayValue?: boolean;
}

interface CustomPhasesProgressBarProps extends PhasesProgressBarProps {
  PhaseComponent: React.FunctionComponent<PhaseComponentProps>;
  InterPhaseComponent: React.FunctionComponent<PhaseComponentProps>;
}

export function CustomPhasesProgressBar({
  value,
  phaseMin,
  phaseMax,
  label,
  displayValue,
  className,
  style,
  PhaseComponent,
  InterPhaseComponent,
}: CustomPhasesProgressBarProps) {
  return (
    <div
      className={
        cx(textCenter, centeredContent, flexColumn, grow) +
        classNameOrEmpty(className)
      }
      style={style}
    >
      {label && <Value className={grow} value={label} />}
      {drawBar(phaseMin, phaseMax, value, PhaseComponent, InterPhaseComponent)}
      {displayValue && <Value className={grow} value={value} />}
    </div>
  );
}

export function PhasesProgressBar(props: PhasesProgressBarProps) {
  return (
    <CustomPhasesProgressBar
      {...props}
      PhaseComponent={SimplePhaseComponent}
      InterPhaseComponent={SimpleInterPhaseComponent}
    />
  );
}
