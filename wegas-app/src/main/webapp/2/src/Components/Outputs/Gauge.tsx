import * as React from 'react';
import {
  expandBoth,
  centeredContent,
  textCenter,
  expandWidth,
  flexColumn,
  grow,
} from '../../css/classes';
import { PieChart, PieChartSection } from './PieChart';
import { wlog } from '../../Helper/wegaslog';
import { Value } from './Value';
import { cx } from 'emotion';

interface GaugeSection {
  backgroundColor: React.CSSProperties['backgroundColor'];
  stopValue: number;
}

export interface GaugeProps {
  /**
   * value - the current value of the slider
   */
  value: number;
  /**
   * min - the minimum value to slide (0 by default)
   */
  min: number;
  /**
   * sections - the sections in the gauge (at least one section must be defined with the maximum value as stopValue)
   */
  sections: GaugeSection[];
  /**
   * label - The label to display with the gauge
   */
  label?: string;
  /**
   * displayValue - should the current value be displayed with the gauge
   */
  displayValue?: boolean;
  /**
   * minAngle - the angle of the min value (0 is left, 90 is top, 180 is right, 270 is bottom)
   */
  minAngle: number;
  /**
   * maxAngle - the angle of the max value (0 is left, 90 is top, 180 is right, 270 is bottom)
   */
  maxAngle: number;
  /**
   * holeSize - the proportion of the hole in the center of the gauge (from 0 to 100)
   */
  holeSize?: number;
}

export function Gauge({
  value,
  min,
  sections,
  label,
  displayValue,
  minAngle,
  maxAngle,
  holeSize = 50,
}: GaugeProps) {
  const sortedSections = sections.sort((a, b) => a.stopValue - b.stopValue);
  const maxValue = sortedSections.slice(-1)[0].stopValue;

  const computedSections: PieChartSection[] = sortedSections.map(s => ({
    angleTo:
      minAngle + ((maxAngle - minAngle) * s.stopValue) / (maxValue - min),
    fill: s.backgroundColor,
  }));

  return (
    <div className={cx(textCenter, centeredContent, flexColumn)}>
      {label && <Value className={grow} value={label} />}
      <PieChart
        minAngle={minAngle}
        sections={computedSections}
        holeSize={holeSize}
        border={{ color: 'black', size: '4' }}
        className={grow}
      />
      {displayValue && <Value className={grow} value={value} />}
    </div>
  );
}
