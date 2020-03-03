import * as React from 'react';
import { wwarn, wlog } from '../../Helper/wegaslog';

const viewBox = {
  minX: 0,
  minY: 0,
  width: 500,
  height: 500,
};

const chartStyle = {
  radius: 240,
};

// https://stackoverflow.com/questions/18206361/svg-multiple-color-on-circle-stroke
function generateGradient(
  sections: PieChartSection[],
  centerX: number,
  centerY: number,
  radius: number,
  holeRatio: number,
) {
  return sections
    .map((s, i, a) => {
      if (a[i - 1] == null) {
        return null;
      } else {
        const lastSection = a[i - 1];
        const startColor = lastSection.fillColor;
        const stopColor = s.fillColor;
        const holeRadius = chartStyle.radius * (holeRatio / 100);
        const colorRadius = (radius + holeRadius) / 2;

        const coord1 = polarToCartesian(
          centerX,
          centerY,
          colorRadius,
          lastSection.angleTo,
        );
        const coord2 = polarToCartesian(
          centerX,
          centerY,
          colorRadius,
          s.angleTo,
        );

        // Create a gradient for this segment
        return (
          <>
            <linearGradient
              key={`pie-grad-${i}`}
              id={`pie-grad-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={coord1.x}
              y1={coord1.y}
              x2={coord2.x}
              y2={coord2.y}
            >
              <stop offset="0%" stopColor={startColor} />
              <stop offset="33%" stopColor={startColor} />
              <stop offset="66%" stopColor={stopColor} />
              <stop offset="100%" stopColor={stopColor} />
            </linearGradient>
          </>
        );
      }
    })
    .filter(s => s != null);
}

export const degreeToRadian = (degAngle: number) =>
  ((degAngle - 180) * Math.PI) / 180;

// https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = degreeToRadian(angleInDegrees);
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

const translationFromAngle = (
  minAngle: number,
  maxAngle: number = minAngle,
  explodeRatio: number = 0,
) => {
  const explodeRadius = chartStyle.radius * (explodeRatio / 100);
  return {
    x: Math.cos(degreeToRadian((maxAngle + minAngle) / 2)) * explodeRadius,
    y: Math.sin(degreeToRadian((maxAngle + minAngle) / 2)) * explodeRadius,
  };
};

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
  holeRatio: number,
  centerX: number,
  centerY: number,
  explodeRatio: number = 0,
  fill?: string,
  stroke?: string,
  strokeWidth?: number,
) {
  const holeRadius = chartStyle.radius * (holeRatio / 100);
  const translate = translationFromAngle(minAngle, maxAngle, explodeRatio);

  // As it's impossible to draw a circle with an arc beacause the start and end points will overlapse,
  // we have to draw 2 arcs instead of one and no line between them.
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
          transform={`translate(${translate.x} ${translate.y})`}
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
          transform={`translate(${translate.x} ${translate.y})`}
        />
      </>
    );
  }
}

function svgStringOfCake(
  minAngle: number,
  maxAngle: number,
  holeRatio: number,
  centerX: number,
  centerY: number,
  stroke?: string,
) {
  const holeRadius = chartStyle.radius * (holeRatio / 100);
  const stringRadius = (holeRadius + chartStyle.radius) / 2;
  const strokeWidth = (chartStyle.radius - stringRadius) * 2;
  return (
    <path
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill="transparent"
      d={`${generateArc(
        stringRadius,
        maxAngle,
        minAngle,
        centerX,
        centerY,
        0,
        true,
      )}`}
    />
  );
}

export interface SimpleNeedleStyle {
  '@class': 'SimpleNeedle';
  color?: string;
  strokeWidth?: number;
}
/**
 * Allows to display a picture for the needle
 * The picture will be centered on the center of the Piechart
 */
export interface ImageNeedleStyle {
  '@class': 'ImageNeedle';
  src: string;
  width: number;
  height: number;
  /**
   * sizeRatio - the zoom to apply on the picture (1.0 by default)
   */
  sizeRatio?: number;
  /**
   * initAngle - the rotation to apply to the image for the needle to point left
   */
  initAngle?: number;
}
export interface SVGNeedleStyle {
  '@class': 'SVGNeedle';
  svg: (
    cX: number,
    cY: number,
    angle: number,
    radius: number,
    holeRadius: number,
    tX: number,
    tY: number,
  ) => JSX.Element;
}

export type NeedleStyle = SimpleNeedleStyle | ImageNeedleStyle | SVGNeedleStyle;

function svgNeedle(
  { needle, needleStyle = { '@class': 'SimpleNeedle' } }: NeedleProps,
  centerX: number,
  centerY: number,
  holeRatio: number = 50,
  explodeRatio: number = 0,
) {
  const holeRadius = chartStyle.radius * (holeRatio / 100);
  const translate = translationFromAngle(needle, undefined, explodeRatio);
  switch (needleStyle['@class']) {
    case 'SimpleNeedle':
      return (
        <path
          stroke={needleStyle.color ? needleStyle.color : 'black'}
          strokeWidth={
            needleStyle.strokeWidth != null ? needleStyle.strokeWidth : 4
          }
          d={generateLine(holeRadius, needle, centerX, centerY, true)}
          transform={`translate(${translate.x} ${translate.y})`}
        />
      );
    case 'ImageNeedle': {
      const initAngle =
        needleStyle.initAngle == null ? 0 : needleStyle.initAngle;
      const sizeRatio =
        needleStyle.sizeRatio == null ? 1 : needleStyle.sizeRatio;
      const width = needleStyle.width * sizeRatio;
      const height = needleStyle.height * sizeRatio;
      const x = centerX - width / 2;
      const y = centerY - height / 2;

      return (
        <image
          href={needleStyle.src}
          x={x}
          y={y}
          width={width}
          height={height}
          transform={`rotate(${initAngle + needle},${centerX},${centerY})`}
        />
      );
    }
    case 'SVGNeedle': {
      return needleStyle.svg(
        centerX,
        centerY,
        needle,
        chartStyle.radius,
        holeRadius,
        translate.x,
        translate.y,
      );
    }
  }
}

const filterSections = (
  sections: (PieChartSection & { minAngle: number })[],
  needleCfg?: NeedleProps,
) => {
  const filteredSections = sections.filter(
    s =>
      // Don't filter if needle is not set
      !needleCfg ||
      !needleCfg.followNeedle ||
      // Keep section if last section as lower angle than needle
      s.minAngle < needleCfg.needle,
  );

  // Finally, set the last section's angle to the needle's angle if followNeedle is sat
  if (needleCfg && needleCfg.followNeedle) {
    filteredSections[filteredSections.length - 1].angleTo = needleCfg.needle;
  }
  return filteredSections;
};

const boundedValue = (value: number, min?: number, max?: number) => {
  if (min != null && max != null && min > max) {
    return 0;
  }
  if (min != null && value < min) {
    return min;
  } else if (max != null && value > max) {
    return max;
  } else {
    return value;
  }
};

/**
 * computedHeights calculates the height of the viewbox and the center of the chart
 * @param minAngle
 * @param maxAngle
 * @param explodeRatio
 */
const computedHeights = (
  minAngle: number,
  maxAngle: number,
  explodeRatio: number = 0,
) => {
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

  const radianMaxAngle = degreeToRadian(maxAngle);
  const radianMinAngle = degreeToRadian(minAngle);

  // const

  const propTop = maxTop
    ? 1
    : -Math.min(Math.sin(radianMaxAngle), Math.sin(radianMinAngle), 0);
  const propBottom = maxBottom
    ? 1
    : Math.max(Math.sin(radianMaxAngle), Math.sin(radianMinAngle), 0);
  const propLeft = maxLeft
    ? 1
    : -Math.min(Math.cos(radianMaxAngle), Math.cos(radianMinAngle), 0);
  const propRight = maxRight
    ? 1
    : Math.max(Math.cos(radianMaxAngle), Math.cos(radianMinAngle), 0);

  const explodeRadius = chartStyle.radius * (explodeRatio / 100);

  const maxHeight = viewBox.height / 2 + explodeRadius;
  const maxWidth = viewBox.width / 2 + explodeRadius;

  const sizeTop = propTop * maxHeight;
  const sizeBottom = propBottom * maxHeight;
  const sizeLeft = propLeft * maxWidth;
  const sizeRight = propRight * maxWidth;

  const gaugeRadius = chartStyle.radius + explodeRadius / 2;
  const gaugeTop = propTop * gaugeRadius;
  const gaugeBottom = propBottom * gaugeRadius;
  const gaugeLeft = propLeft * gaugeRadius;
  const gaugeRight = propRight * gaugeRadius;

  const marginY = maxHeight - chartStyle.radius;
  const marginX = maxWidth - chartStyle.radius;

  const centerY = gaugeTop + marginY / 2;
  const centerX = gaugeLeft + marginX / 2;

  return {
    height: sizeTop + sizeBottom,
    width: sizeLeft + sizeRight,
    centerY,
    centerX,
    gaugeTop,
    gaugeBottom,
    gaugeLeft,
    gaugeRight,
  };
};

export interface NeedleProps {
  /**
   * needle - if set, a needle pointing and angle will be set
   */
  needle: number;
  /**
   * followNeedle - if true, only the sections behind the needle will be displayed
   */
  followNeedle?: boolean;
  /**
   * needleStyle - defines severa way to display a needle
   */
  needleStyle?: NeedleStyle;
}

export interface BorderProps {
  /**
   * color - the color of the border
   */
  color: string;
  /**
   * size - the size of the border computed as a number because css size does not make sense in a viewbox
   */
  size?: number;
}

export interface PieChartSection {
  /**
   * angleTo - the threshhold section angle
   */
  angleTo: number;
  /**
   * fillColor - the section color
   */
  fillColor?: string;
  /**
   * border - the section border
   */
  border?: BorderProps;
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
   * needleCfg - if set, will display a needle in the chart
   */
  needleCfg?: NeedleProps;
  /**
   * border - the border style to apply on the pie chart
   */
  border?: BorderProps;
  /**
   * holeRatio - the proportion of the hole in the center of the pie chart (from 0 to 100)
   */
  holeRatio?: number;
  /**
   * explodeRatio - the explode proportion of the pie chart (from 0 to ∞)
   */
  explodeRatio?: number;
  /**
   * useGradient - blur the color sections
   */
  useGradient?: boolean;
  /**
   * className - the class of the div around the pie chart
   */
  className?: string;
}

export function PieChart({
  minAngle,
  sections,
  border,
  useGradient,
  needleCfg,
  holeRatio = 50,
  explodeRatio = 0,
  className,
}: PieChartProps) {
  if (needleCfg != null && explodeRatio > 0) {
    wwarn(
      'Displaying a needle in an exploded Piechart does not make sense!\n\
      If you really want to do it, it is recommanded to add transparent sections between the colored sections and set explodeRatio to 0',
    );
  }

  // Verify values
  const computedMinAngle = boundedValue(minAngle, -360, 360);
  const computedHoleRatio = boundedValue(holeRatio, 0, 100);
  const computedExplodeRatio = boundedValue(explodeRatio, 0);

  // Avoid 0 section
  if (sections.length === 0) {
    return <pre>{`At least one section must be set in the PieChart`}</pre>;
  }

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

  // If max angle is greater than 360, rationalize section angles
  const deltaAngle = maxAngle - minAngle;
  const angleRatio = deltaAngle > 360 ? 360 / deltaAngle : 1;
  const computedMaxAngle = deltaAngle > 360 ? minAngle + 360 : maxAngle;
  computedSections = computedSections.map(s => ({
    ...s,
    minAngle: s.minAngle * angleRatio,
    angleTo: s.angleTo * angleRatio,
  }));

  //Filter the sections if follow needle is active
  const filteredSections = filterSections(computedSections, needleCfg);

  let bluredSections: (PieChartSection & { minAngle: number })[] = [];
  const firstSection = computedSections[0];
  const lastSection = computedSections[computedSections.length - 1];
  const angleShift =
    (firstSection.minAngle + firstSection.angleTo) / 2 - firstSection.minAngle;
  bluredSections = [
    ...computedSections.map((s, i) =>
      i === 0
        ? {
            ...s,
            minAngle: s.minAngle,
            angleTo: s.minAngle + angleShift,
          }
        : {
            ...s,
            minAngle: s.minAngle - angleShift,
            angleTo: s.angleTo - angleShift,
          },
    ),
    {
      angleTo: maxAngle,
      fillColor: lastSection.fillColor,
      minAngle: maxAngle - angleShift,
      border: lastSection.border,
    },
  ];

  const filteredBlurSections = filterSections(bluredSections, needleCfg);

  // Compute viewbox and center values to keep the chart centered in the viewbox
  const { width, height, centerX, centerY } = computedHeights(
    minAngle,
    computedMaxAngle,
    explodeRatio,
  );

  if (needleCfg && needleCfg.followNeedle) {
    wlog('computedSections');
    wlog(computedSections);
    wlog('bluredSections');
    wlog(bluredSections);
    wlog('filteredBlurSections');
    wlog(filteredBlurSections);
    wlog('needleCfg');
    wlog(needleCfg);
  }

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`}>
        {useGradient && (
          <defs>
            {generateGradient(
              bluredSections,
              centerX,
              centerY,
              chartStyle.radius,
              holeRatio,
            )}
          </defs>
        )}
        {filteredSections.map(s =>
          svgPieceOfCake(
            s.minAngle,
            s.angleTo,
            computedHoleRatio,
            centerX,
            centerY,
            explodeRatio,
            s.fillColor,
            s.border
              ? s.border.color
              : computedExplodeRatio > 0
              ? border?.color
              : undefined,
            s.border
              ? s.border.size
              : computedExplodeRatio > 0
              ? border?.size
              : undefined,
          ),
        )}
        {useGradient &&
          filteredBlurSections.map((s, i) =>
            svgStringOfCake(
              s.minAngle,
              s.angleTo,
              computedHoleRatio,
              centerX,
              centerY,
              i === 0 || i === bluredSections.length - 1
                ? s.fillColor
                : `Url(#pie-grad-${i})`,
              // s.fillColor,
            ),
          )}
        {filteredBlurSections.map(s =>
          svgPieceOfCake(
            s.minAngle,
            s.angleTo,
            computedHoleRatio,
            centerX,
            centerY,
            explodeRatio,
            undefined,
            'black',
            5,
          ),
        )}
        {border &&
          computedExplodeRatio === 0 &&
          svgPieceOfCake(
            computedMinAngle,
            maxAngle,
            computedHoleRatio,
            centerX,
            centerY,
            undefined,
            'url(#Gradient)',
            border.color,
            border.size,
          )}
        {needleCfg &&
          svgNeedle(needleCfg, centerX, centerY, holeRatio, explodeRatio)}
      </svg>
    </div>
  );
}
