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
  value: number,
  phases: number,
  PhaseComponent: React.FunctionComponent<PhaseComponentProps>,
  InterPhaseComponent: React.FunctionComponent<PhaseComponentProps>,
) {
  const content: JSX.Element[] = [];

  for (let i = 0; i < phases; i++) {
    if (i > 0) {
      content.push(<InterPhaseComponent value={value} phase={i} />);
    }
    content.push(<PhaseComponent value={value} phase={i} />);
  }
  return <div className={cx(flex, flexDistribute, itemCenter)}>{content}</div>;
}

export interface PhasesProgressBarProps {
  /**
   * value - the current value of the progess bar
   */
  value: number;
  /**
   * phases - the number of phases
   */
  phases: number;
  /**
   * label - The label to display with the gauge
   */
  label?: string;
  /**
   * displayValue - should the current value be displayed with the gauge
   */
  displayValue?: boolean;
  /**
   * className - the classes to apply on the componnent
   */
  className?: string;
}

interface CustomPhasesProgressBarProps extends PhasesProgressBarProps {
  PhaseComponent: React.FunctionComponent<PhaseComponentProps>;
  InterPhaseComponent: React.FunctionComponent<PhaseComponentProps>;
}

export function CustomPhasesProgressBar({
  value,
  phases,
  label,
  displayValue,
  className,
  PhaseComponent,
  InterPhaseComponent,
}: CustomPhasesProgressBarProps) {
  return (
    <div className={cx(textCenter, centeredContent, flexColumn, className)}>
      {label && <Value className={grow} value={label} />}
      {drawBar(value, phases, PhaseComponent, InterPhaseComponent)}
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
