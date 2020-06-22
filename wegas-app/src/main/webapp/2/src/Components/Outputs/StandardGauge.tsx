import * as React from 'react';
import { CustomGauge } from './CustomGauge';
import { degreeToRadian } from './PieChart';

const sectionsColor = [
  { backgroundColor: 'red', stopValue: 20 },
  { backgroundColor: 'yellow', stopValue: 80 },
  { backgroundColor: 'green', stopValue: 100 },
];

export interface StandardGaugeProps {
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
   * label - The label to display with the gauge
   */
  label?: string;
  /**
   * followNeedle - if true, only the sections behind the needle will be displayed
   */
  followNeedle?: boolean;
}

export function StandardGauge({
  value,
  min,
  max,
  label,
  followNeedle,
}: StandardGaugeProps) {
  const deltaValue = max - min;
  const sections = sectionsColor.map(s => ({
    ...s,
    stopValue: (s.stopValue / 100) * deltaValue + min,
  }));
  return (
    <CustomGauge
      value={value}
      min={min}
      sections={sections}
      minAngle={15}
      maxAngle={165}
      displayValue
      holeRatio={0.8}
      label={label}
      needleStyle={{
        '@class': 'SVGNeedle',
        svg: (cX, cY, angle, radius, holeRadius) => {
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
        },
      }}
      blur
      followNeedle={followNeedle}
    />
  );
}
