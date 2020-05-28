import * as React from 'react';
import {
  centeredContent,
  textCenter,
  flexColumn,
  grow,
  expandWidth,
} from '../../css/classes';
import { PieChart, PieChartSection, NeedleStyle } from './PieChart';
import { Value } from './Value';
import { cx } from 'emotion';

const valueToAngle = (
  value: number,
  minValue: number,
  maxValue: number,
  minAngle: number,
  maxAngle: number,
) => minAngle + ((maxAngle - minAngle) * value) / (maxValue - minValue);

export interface GaugeSection
  extends Omit<PieChartSection, 'angleTo' | 'fillColor'> {
  /**
   * stopValue - the section end value
   */
  stopValue: number;
  /**
   * backgroundColor - the color of the section
   */
  backgroundColor: React.CSSProperties['backgroundColor'];
}

export interface CustomGaugeProps {
  /**
   * value - the current value of the slider
   */
  value: number;
  /**
   * min - the minimum value to slide
   */
  min: number;
  /**
   * minAngle - the angle of the min value (0 is left, 90 is top, 180 is right, 270 is bottom)
   */
  minAngle: number;
  /**
   * maxAngle - the angle of the max value (0 is left, 90 is top, 180 is right, 270 is bottom)
   */
  maxAngle: number;
  /**
   * sections - the sections in the gauge (at least one section must be defined with the maximum value as stopValue)
   */
  sections: GaugeSection[];
  /**
   * label - The label to display with the gauge
   */
  label?: string;
  /**
   * followNeedle - if true, only the sections behind the needle will be displayed
   */
  followNeedle?: boolean;
  /**
   * needleStyle - defines the styleof the needle
   */
  needleStyle?: NeedleStyle;
  /**
   * displayValue - should the current value be displayed with the gauge
   */
  displayValue?: boolean;
  /**
   * paddingRatio - the proportional size of the internal margin (from 0 to 1)
   */
  paddingRatio?: number;
  /**
   * holeSize - the proportion of the hole in the center of the gauge (from 0 to 100)
   */
  holeRatio?: number;
  /**
   * explodeSize - the explode proportion of the gauge (from 0 to ∞)
   */
  explodeRatio?: number;
  /**
   * useGradient - blur the color sections
   */
  blur?: boolean;
}

export function CustomGauge({
  value,
  min,
  sections,
  label,
  followNeedle,
  needleStyle,
  displayValue,
  minAngle,
  maxAngle,
  paddingRatio,
  holeRatio = 50,
  explodeRatio = 0,
  blur,
}: CustomGaugeProps) {
  const sortedSections = sections.sort((a, b) => a.stopValue - b.stopValue);
  const maxValue = sortedSections.slice(-1)[0].stopValue;
  const computedSections: PieChartSection[] = sortedSections.map(s => ({
    ...s,
    fillColor: s.backgroundColor,
    angleTo: valueToAngle(s.stopValue, min, maxValue, minAngle, maxAngle),
  }));

  return (
    <div className={cx(textCenter, centeredContent, flexColumn, expandWidth)}>
      {label && <Value className={grow} value={label} />}
      <PieChart
        needleCfg={{
          needle: valueToAngle(value, min, maxValue, minAngle, maxAngle),
          followNeedle,
          needleStyle,
        }}
        minAngle={minAngle}
        sections={computedSections}
        paddingRatio={paddingRatio}
        holeRatio={holeRatio}
        explodeRatio={explodeRatio}
        border={{ color: 'black', size: 4 }}
        className={grow}
        blur={blur}
      />
      {displayValue && <Value className={grow} value={value} />}
    </div>
  );
}
