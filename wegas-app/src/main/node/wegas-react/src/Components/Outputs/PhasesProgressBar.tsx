import * as React from 'react';
import {
  justifyCenter,
  textCenter,
  flexColumn,
  grow,
  flex,
  flexDistribute,
  itemCenter,
  halfOpacity,
} from '../../css/classes';
import { Value } from './Value';
import { cx, css } from 'emotion';
import { IconComp } from '../../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../../Helper/className';
import { themeVar } from '../Theme/ThemeVars';

const phasePathStyle = css({
  height: '0.5em',
  width: '100%',
  backgroundColor: themeVar.colors.PrimaryColor,
});

const phaseDotStyle = css({
  borderRadius: '50%',
  borderStyle: 'solid',
  borderWidth: '5px',
  borderColor: themeVar.colors.PrimaryColor,
});

export interface PhaseComponentProps {
  /**
   * value - the current value of the progess bar
   */
  value: number;
  /**
   * phase - the phase of the component
   */
  phase: number;
}

export function SimplePhaseComponent({ value, phase }: PhaseComponentProps) {
  return (
    <div className={'phaseDotStyle ' + phaseDotStyle}>
      <IconComp
        icon={{
          icon: phase < value ? 'check-circle' : 'dot-circle',
          fixedWidth: false,
          size: 'lg',
          color:
            phase < value
              ? themeVar.colors.PrimaryColor
              : phase > value
              ? 'transparent'
              : themeVar.colors.ActiveColor,
        }}
      />
    </div>
  );
}

export function SimpleInterPhaseComponent(_props: PhaseComponentProps) {
  return <div className={'phasePathStyle ' + phasePathStyle}></div>;
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

export interface PhasesProgressBarProps extends ClassStyleId {
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
  /**
   * disabled - if true, displayed as disabled
   */
  disabled?: boolean;
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
  disabled,
}: CustomPhasesProgressBarProps) {
  return (
    <div
      className={
        'wegas wegas-phaseProgessBar ' +
        cx(flex, textCenter, justifyCenter, flexColumn, grow, {
          [halfOpacity]: disabled,
        }) +
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
