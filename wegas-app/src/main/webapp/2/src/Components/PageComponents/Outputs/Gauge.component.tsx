import * as React from 'react';
import { css } from 'emotion';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { useVariableInstance } from '../../Hooks/useVariable';
import { themeVar } from '../../Theme';
import { FontAwesome } from '../../../Editor/Components/Views/FontAwesome';
import { schemaProps } from '../tools/schemaProps';
import { useScript } from '../../Hooks/useScript';

const containerStyle = css({
  minWidth: '8em',
  position: 'relative',
});
const textStyle = css({
  position: 'absolute',
  bottom: 0,
  width: '100%',
  textAlign: 'center',
});
function degToRad(angle: number) {
  return (Math.PI * angle) / 180;
}
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle_deg: number,
) {
  const rad = degToRad(angle_deg);
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}
/**
 * Compute the ratio of a given value between it's boundaries
 * @param value
 * @param min
 * @param max
 */
function ratio(value: number, min: number, max: number) {
  return (value - min) / (max - min);
}

interface GaugeProps extends PageComponentMandatoryProps {
  /**
   * script - a script returning a NumberDescriptor
   */
  script?: IScript;
  /**
   * Zero, defaults to min
   */
  neutralValue?: number;
  /**
   * Color above neutral threshold
   */
  positiveColor?: string;
  /**
   * Color bellow neutral threshold
   */
  negativeColor?: string;
}

const Gauge: React.FunctionComponent<GaugeProps> = (props: GaugeProps) => {
  const { script, EditHandle } = props;
  const descriptor = useScript(
    script ? script.content : '',
  ) as ISNumberDescriptor;
  const instance = useVariableInstance(descriptor);
  if (descriptor === undefined || instance === undefined) {
    return (
      <>
        <EditHandle />
        <pre>Not found: {script}</pre>
      </>
    );
  }
  const {
    positiveColor = themeVar.successColor,
    negativeColor = themeVar.errorColor,
  } = props;
  const min = descriptor.minValue;
  const max = descriptor.maxValue;
  if (min == null || max == null || min === max) {
    return (
      <>
        <EditHandle />
        <span>
          <FontAwesome
            style={{ color: themeVar.warningColor }}
            icon="exclamation-triangle"
          />
          {min === max
            ? `Min value (${min}) and max value (${max}) are the same, use a number box to display a constant number`
            : `Missing min or max value in ${descriptor.label}`}
        </span>
      </>
    );
  }
  const boundedValue = Math.max(min, Math.min(max, instance.value));
  const neutral = props.neutralValue === undefined ? min : props.neutralValue;
  const neutralAngle = 180 - ratio(neutral, min, max) * 180;
  const start = polarToCartesian(500, 500, 450, neutralAngle);
  const valueAngle = 180 - ratio(boundedValue, min, max) * 180;
  const end = polarToCartesian(500, 500, 450, valueAngle);
  const positive = valueAngle < neutralAngle;

  return (
    <>
      {props.EditHandle}
      <div className={containerStyle}>
        <svg viewBox="0 0 1000 500">
          <path
            strokeWidth="75"
            fill="none"
            stroke={themeVar.disabledColor}
            d="M 50 500 A 450 450 0 0 1 950 500"
          />
          <path
            strokeWidth="75"
            fill="none"
            stroke={positive ? positiveColor : negativeColor}
            d={`M ${start[0]} ${start[1]} A 450 450 0 0 ${positive ? 1 : 0} ${
              end[0]
            } ${end[1]}`}
          />
          <circle
            cx={end[0]}
            cy={end[1]}
            r="37"
            strokeWidth="20"
            stroke={themeVar.primaryLighterColor}
            fill={themeVar.primaryDarkerColor}
          />
        </svg>
        <div className={textStyle}>
          <div>{descriptor.label}</div>
          <div>{instance.value}</div>
        </div>
      </div>
    </>
  );
};

registerComponent(
  pageComponentFactory(
    Gauge,
    'Gauge',
    'tachometer-alt',
    {
      script: schemaProps.scriptVariable(
        'Variable',
        false,
        ['NumberDescriptor'],
        true,
      ),
      neutralValue: schemaProps.number('Neutral value', false),
      positiveColor: schemaProps.string('Positive color', false),
      negativeColor: schemaProps.string('Negative color', false),
    },
    [],
    () => ({}),
  ),
);
