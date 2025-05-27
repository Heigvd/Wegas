import * as React from 'react';
import { CustomGauge } from './CustomGauge';
import { degreeToRadian, SVGNeedleStyle } from './PieChart';

const defaultSectionsColor = [
  { backgroundColor: 'red', stopValue: 20 },
  { backgroundColor: 'yellow', stopValue: 80 },
  { backgroundColor: 'green', stopValue: 100 },
];

function standardNeedle(
  cX: number,
  cY: number,
  angle: number,
  radius: number,
  holeRadius: number,
) {
  const border = 10;
  const width = radius - holeRadius + 2 * border;
  const radAngle = degreeToRadian(angle);
  const x = Math.cos(radAngle) * (radius + border) + cX;
  const y = Math.sin(radAngle) * (radius + border) + cY;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={10}
      fill="black"
      rotate={radAngle}
      transform={`rotate(${angle} ${x} ${y})`}
    />
  );
}

const defaultNeedleStyle: SVGNeedleStyle = {
  '@class': 'SVGNeedle',
  svg: standardNeedle,
};

export interface StandardGaugeProps extends ClassStyleId {
  /**
   * value - the current value of the slider
   */
  value: number;
  /**
   * min - the minimum value to slide
   */
  min: number;
  /**
   * max - the maximum value to slide
   */
  max: number;
  /**
   * colors - user defined color sections
   */
  colors?: [{ backgroundColor: string; stopValue: number }];
  /**
   * label - The label to display with the gauge
   */
  label?: string;
  /**
   * followNeedle - if true, only the sections behind the needle will be displayed
   */
  followNeedle?: boolean;
  /**
   * disabled - if true, the element will be disabled (styling mainly)
   */
  disabled?: boolean;
}

export function StandardGauge({
  value,
  min,
  max,
  label,
  followNeedle,
  colors,
  className,
  style,
  id,
  disabled,
}: StandardGaugeProps) {
  const deltaValue = max - min;
  const sectionColors = colors?.length ? colors : defaultSectionsColor;
  const maxValue = Math.max(...sectionColors.map(c => c.stopValue));
  const sections = sectionColors!.map(s => ({
    backgroundColor:
      s.backgroundColor === undefined ? 'black' : s.backgroundColor, // Weird behaviour if undefined
    stopValue: (s.stopValue / maxValue) * deltaValue + min,
  }));

  return (
    <CustomGauge
      className={className}
      style={style}
      id={id}
      value={value}
      min={min}
      sections={sections}
      minAngle={15}
      maxAngle={165}
      displayValue
      holeRatio={0.8}
      label={label}
      disabled={disabled}
      needleStyle={defaultNeedleStyle}
      blur
      followNeedle={followNeedle}
    />
  );
}
