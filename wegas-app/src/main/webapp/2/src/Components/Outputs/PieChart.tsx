import * as React from 'react';
import { wlog } from '../../Helper/wegaslog';
import { max } from 'lodash-es';

const viewBox = {
  minX: 0,
  minY: 0,
  width: 500,
  height: 500,
};

const chartStyle = {
  centerX: viewBox.width / 2,
  centerY: viewBox.height / 2,
  radius: 240,
};

// https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function generateArc(
  radius: number,
  maxAngle: number,
  minAngle: number,
  centerX: number,
  centerY: number,
  invert: 0 | 1 = 0,
  startCoordinates?: boolean,
) {
  const start = polarToCartesian(
    centerX,
    centerY,
    radius,
    invert ? minAngle : maxAngle,
  );
  const end = polarToCartesian(
    centerX,
    centerY,
    radius,
    invert ? maxAngle : minAngle,
  );
  const largeArcFlag = maxAngle - minAngle <= 180 ? '0' : '1';

  return [
    ...(startCoordinates ? ['M', start.x, start.y] : []),
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    invert,
    end.x,
    end.y,
  ].join(' ');
}

function generateLine(
  radius: number,
  angle: number,
  centerX: number,
  centerY: number,
  startCoordinates?: boolean,
) {
  const start = polarToCartesian(centerX, centerY, chartStyle.radius, angle);
  const end = polarToCartesian(centerX, centerY, radius, angle);

  return [
    ...(startCoordinates ? ['M', start.x, start.y] : []),
    'L',
    end.x,
    end.y,
  ].join(' ');
}

function svgPieceOfCake(
  minAngle: number,
  maxAngle: number,
  holeSize: number,
  centerX: number,
  centerY: number,
  fill?: string,
  stroke?: string,
  strokeWidth?: string,
) {
  const holeRadius = chartStyle.radius * (holeSize / 100);

  //As it's impossible to draw a circle with an arc beacause the start and end points will overlapse, we have to draw 2 arcs instead of one and no line between them
  if (maxAngle - minAngle === 360) {
    return (
      <>
        <path
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={fill ? fill : 'transparent'}
          fillRule="evenodd"
          d={`
            ${generateArc(
              chartStyle.radius,
              maxAngle / 2,
              minAngle,
              centerX,
              centerY,
              0,
              true,
            )}
            ${generateArc(
              chartStyle.radius,
              maxAngle,
              maxAngle / 2,
              centerX,
              centerY,
              0,
            )}
            ${generateArc(
              holeRadius,
              maxAngle / 2,
              minAngle,
              centerX,
              centerY,
              1,
              true,
            )}
            ${generateArc(
              holeRadius,
              maxAngle,
              maxAngle / 2,
              centerX,
              centerY,
              1,
            )}
            `}
        />
      </>
    );
  } else {
    return (
      <>
        <path
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill={fill ? fill : 'transparent'}
          fillRule="evenodd"
          d={`
                  ${generateArc(
                    chartStyle.radius,
                    maxAngle,
                    minAngle,
                    centerX,
                    centerY,
                    0,
                    true,
                  )}
                  ${generateLine(holeRadius, minAngle, centerX, centerY)}
                  ${generateArc(
                    holeRadius,
                    maxAngle,
                    minAngle,
                    centerX,
                    centerY,
                    1,
                  )}
                  Z
                `}
        />
      </>
    );
  }
}

const boundedValue = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

const computedHeights = (minAngle: number, maxAngle: number) => {
  const maxTop =
    (maxAngle >= 90 && minAngle <= 90) ||
    (maxAngle >= -270 && minAngle <= -270);
  const maxBottom =
    (maxAngle >= 270 && minAngle <= 270) ||
    (maxAngle >= -90 && minAngle <= -90);
  const maxLeft =
    (maxAngle >= 0 && minAngle <= 0) || (maxAngle >= -360 && minAngle <= -360);
  const maxRight =
    (maxAngle >= 180 && minAngle <= 180) ||
    (maxAngle >= -180 && minAngle <= -180);

  const radianMaxAngle = (maxAngle / 360) * 2 * Math.PI;
  const radianMinAngle = (minAngle / 360) * 2 * Math.PI;

  const propTop = maxTop
    ? 1
    : Math.max(Math.sin(radianMaxAngle), Math.sin(radianMinAngle), 0);
  const propBottom = maxBottom
    ? 1
    : -Math.min(Math.sin(radianMaxAngle), Math.sin(radianMinAngle), 0);
  const propLeft = maxLeft
    ? 1
    : Math.max(Math.cos(radianMaxAngle), Math.cos(radianMinAngle), 0);
  const propRight = maxRight
    ? 1
    : -Math.min(Math.cos(radianMaxAngle), Math.cos(radianMinAngle), 0);

  const sizeTop = propTop * (viewBox.height / 2);
  const sizeBottom = propBottom * (viewBox.height / 2);
  const sizeLeft = propLeft * (viewBox.height / 2);
  const sizeRight = propRight * (viewBox.height / 2);

  const gaugeTop = propTop * chartStyle.radius;
  const gaugeLeft = propLeft + chartStyle.radius;

  return {
    height: sizeTop + sizeBottom,
    width: sizeLeft + sizeRight,
    centerY: sizeTop ? sizeTop - 5 : 5,
    centerX: sizeLeft ? sizeLeft - 5 : 5,
  };
};

export interface PieChartSection {
  angleTo: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
}

export interface PieChartProps {
  /**
   * minAngle - the angle of the pie chart (0 is left, 90 is top, 180 is right, 270 is bottom)
   */
  minAngle: number;
  /**
   * sections - the sections in the pie chart (at least one section must be defined with the maximum value as the maximum angle)
   */
  sections: PieChartSection[];
  /**
   * border - the border style to apply on the pie chart
   */
  border?: {
    color: string;
    size?: string;
  };
  /**
   * holeSize - the proportion of the hole in the center of the pie chart (from 0 to 100)
   */
  holeSize?: number;
  /**
   * explodeSize - the explode proportion of the pie chart (from 0 to 100)
   */
  explodeSize?: number;
  /**
   * className - the class of the div around the pie chart
   */
  className?: string;
}

export function PieChart({
  minAngle,
  sections,
  border,
  holeSize = 50,
  explodeSize = 0,
  className,
}: PieChartProps) {
  // Verify values
  const computedMinAngle = boundedValue(minAngle, -360, 360);
  const computedHoleSize = boundedValue(holeSize, 0, 100);
  const computedExplodeSize = boundedValue(explodeSize, 0, 100);

  // Generate slices
  let computedSections = sections
    .sort((a, b) => a.angleTo - b.angleTo)
    .map((s, i, a) => ({
      ...s,
      minAngle: i === 0 ? computedMinAngle : a[i - 1].angleTo,
    }));

  // Compute values
  const maxAngle = computedSections.slice(-1)[0].angleTo;

  // Avoid anti-clockwise chart
  if (maxAngle <= minAngle) {
    return (
      <pre>{`Max angle [${maxAngle}] should be greater than min angle [${minAngle}]`}</pre>
    );
  }

  const deltaAngle = maxAngle - minAngle;
  const angleRatio = deltaAngle > 360 ? 360 / deltaAngle : 1;
  const computedMaxAngle = deltaAngle > 360 ? minAngle + 360 : maxAngle;
  computedSections = computedSections.map(s => ({
    ...s,
    minAngle: s.minAngle * angleRatio,
    angleTo: s.angleTo * angleRatio,
  }));
  const { width, height, centerX, centerY } = computedHeights(
    minAngle,
    computedMaxAngle,
  );

  wlog({ width, height, centerX, centerY });

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`}>
        {computedSections.map(s =>
          svgPieceOfCake(
            s.minAngle,
            s.angleTo,
            computedHoleSize,
            centerX,
            centerY,
            s.fill,
            s.stroke,
            s.strokeWidth,
          ),
        )}
        {border &&
          svgPieceOfCake(
            computedMinAngle,
            maxAngle,
            computedHoleSize,
            centerX,
            centerY,
            undefined,
            border.color,
            border.size,
          )}
      </svg>
    </div>
  );
}
