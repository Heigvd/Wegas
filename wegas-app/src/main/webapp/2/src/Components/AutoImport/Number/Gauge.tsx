import * as React from 'react';
import {
  useVariableDescriptor,
  useVariableInstance,
} from '../../Hooks/useVariable';
import { TranslatableContent } from '../../../data/i18n';
import { FontAwesome } from '../../../Editor/Components/Views/FontAwesome';
import { css } from 'emotion';
import { themeVar } from '../../Theme/ThemeVars';
import { INumberDescriptor } from 'wegas-ts-api';
import { TumbleLoader } from '../../Loader';
import { wwarn } from '../../../Helper/wegaslog';

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
export default function Gauge(props: {
  variable: string;
  /**
   * lower bound, defaults to descriptor.minValue
   */
  min?: number;
  /**
   * upper bound, defaults to descriptor.maxValue
   */
  max?: number;
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
}) {
  const descriptor = useVariableDescriptor<INumberDescriptor>(props.variable);
  const instance = useVariableInstance(descriptor);
  if (descriptor === undefined || instance === undefined) {
    wwarn(`Not found: ${props.variable}`);
    return <TumbleLoader />;
  }
  const {
    min = descriptor.minValue,
    max = descriptor.maxValue,
    positiveColor = themeVar.Common.colors.SuccessColor,
    negativeColor = themeVar.Common.colors.ErrorColor,
  } = props;
  if (min == undefined || max == undefined) {
    return (
      <span>
        <FontAwesome
          style={{ color: themeVar.Common.colors.WarningColor }}
          icon="exclamation-triangle"
        />
        Missing min or max value
      </span>
    );
  }
  const boundedValue = Math.max(min, Math.min(max, instance.getValue()));
  const neutral = props.neutralValue === undefined ? min : props.neutralValue;
  const neutralAngle = 180 - ratio(neutral, min, max) * 180;
  const start = polarToCartesian(500, 500, 450, neutralAngle);
  const valueAngle = 180 - ratio(boundedValue, min, max) * 180;
  const end = polarToCartesian(500, 500, 450, valueAngle);
  const positive = valueAngle < neutralAngle;

  return (
    <div className={containerStyle}>
      <svg viewBox="0 0 1000 500">
        <path
          strokeWidth="75"
          fill="none"
          stroke={themeVar.Common.colors.DisabledColor}
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
          stroke={themeVar.Common.colors.PrimaryColor}
          fill={themeVar.Common.colors.HeaderColor}
        />
      </svg>
      <div className={textStyle}>
        <div>{TranslatableContent.toString(descriptor.label)}</div>
        <div>{instance.getValue()}</div>
      </div>
    </div>
  );
}
