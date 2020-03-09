import * as React from 'react';
import { wwarn } from '../../Helper/wegaslog';
import { cloneDeep } from 'lodash-es';
import u from 'immer';
import { useDeepChanges } from '../Hooks/useDeepChanges';

const viewBox = {
  minX: 0,
  minY: 0,
  size: 2000,
  initPaddingRatio: 0.1,
};

let pieChartId = 0;

// https://stackoverflow.com/questions/18206361/svg-multiple-color-on-circle-stroke
// TODO : test 3rd answer
const generateGradient = (
  sections: ComputedPieChartSection[],
  centerX: number,
  centerY: number,
  startRadius: number,
  stopRadius: number,
) => {
  const newPieChartId = `pie-grad-${pieChartId++}-`;
  return {
    gradients: sections
      .map((s, i, a) => {
        const lastSection = i === 0 ? a[a.length - 1] : a[i - 1];
        const startColor = lastSection.fillColor;
        const stopColor = s.fillColor;
        const colorRadius = (startRadius + stopRadius) / 2;
        const lastDelta = (lastSection.angleTo - lastSection.minAngle) / 2;
        const currentDelta = (s.angleTo - s.minAngle) / 2;
        const minDelta = Math.min(lastDelta, currentDelta);
        const startAngle = s.minAngle - minDelta;
        const stopAngle = s.minAngle + minDelta;

        const coord1 = polarToCartesian(
          centerX,
          centerY,
          colorRadius,
          startAngle,
        );
        const coord2 = polarToCartesian(
          centerX,
          centerY,
          colorRadius,
          stopAngle,
        );

        // Create a gradient for this segment
        return (
          <linearGradient
            key={newPieChartId + i}
            id={newPieChartId + i}
            gradientUnits="userSpaceOnUse"
            x1={coord1.x}
            y1={coord1.y}
            x2={coord2.x}
            y2={coord2.y}
          >
            <stop offset="0%" stopColor={startColor} />
            {/* <stop offset="25%" stopColor={startColor} />
              <stop offset="75%" stopColor={stopColor} /> */}
            <stop offset="100%" stopColor={stopColor} />
          </linearGradient>
        );
        // }
      })
      .filter(s => s != null),
    currentId: newPieChartId,
  };
};

export const degreeToRadian = (degAngle: number) =>
  ((degAngle - 180) * Math.PI) / 180;

// https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = degreeToRadian(angleInDegrees);
  return {
    x: (centerX + radius * Math.cos(angleInRadians)).toFixed(2),
    y: (centerY + radius * Math.sin(angleInRadians)).toFixed(2),
  };
};

const translationFromAngle = (
  radius: number,
  minAngle: number,
  maxAngle: number = minAngle,
  explodeRatio: number = 0,
) => {
  const explodeRadius = radius * explodeRatio;
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
  invert?: boolean,
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
    Number(invert),
    end.x,
    end.y,
  ].join(' ');
}

export const generateLine = (
  startRadius: number,
  stopRadius: number,
  angle: number,
  centerX: number,
  centerY: number,
  startCoordinates?: boolean,
) => {
  const start = polarToCartesian(centerX, centerY, startRadius, angle);
  const end = polarToCartesian(centerX, centerY, stopRadius, angle);

  return [
    ...(startCoordinates ? ['M', start.x, start.y] : []),
    'L',
    end.x,
    end.y,
  ].join(' ');
};

interface SvgPieceOfCakeProps {
  minAngle: number;
  maxAngle: number;
  centerX: number;
  centerY: number;
  startRadius: number;
  stopRadius: number;
  explodeRatio?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

function SvgPieceOfCake({
  minAngle,
  maxAngle,
  centerX,
  centerY,
  startRadius,
  stopRadius,
  explodeRatio = 0,
  fill,
  stroke,
  strokeWidth,
}: SvgPieceOfCakeProps) {
  const translate = translationFromAngle(
    stopRadius,
    minAngle,
    maxAngle,
    explodeRatio,
  );
  const deltaAngle = maxAngle - minAngle;
  const computedMaxAngle = minAngle + deltaAngle / 2;
  // As it's impossible to draw a circle with an arc beacause the start and end points will overlapse,
  // we have to draw 2 arcs instead of one and no line between them.
  if (deltaAngle === 360) {
    return (
      <path
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill ? fill : 'transparent'}
        fillRule="evenodd"
        d={`
            ${generateArc(
              stopRadius,
              computedMaxAngle,
              minAngle,
              centerX,
              centerY,
              false,
              true,
            )}
            ${generateArc(
              stopRadius,
              maxAngle,
              computedMaxAngle,
              centerX,
              centerY,
              false,
            )}
            ${generateArc(
              startRadius,
              computedMaxAngle,
              minAngle,
              centerX,
              centerY,
              true,
              true,
            )}
            ${generateArc(
              startRadius,
              maxAngle,
              computedMaxAngle,
              centerX,
              centerY,
              true,
            )}
            `}
        transform={`translate(${translate.x} ${translate.y})`}
      />
    );
  } else {
    return (
      <path
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill ? fill : 'transparent'}
        fillRule="evenodd"
        d={`
                  ${generateArc(
                    stopRadius,
                    maxAngle,
                    minAngle,
                    centerX,
                    centerY,
                    false,
                    true,
                  )}
                  ${generateLine(
                    stopRadius,
                    startRadius,
                    minAngle,
                    centerX,
                    centerY,
                  )}
                  ${generateArc(
                    startRadius,
                    maxAngle,
                    minAngle,
                    centerX,
                    centerY,
                    true,
                  )}
                  Z
                `}
        transform={`translate(${translate.x} ${translate.y})`}
      />
    );
  }
}

interface SvgBlurredPieceOfCakeProps extends Omit<SvgPieceOfCakeProps, 'fill'> {
  leftFill?: string;
  rightFill?: string;
  originalSection: ComputedPieChartSection;
}

function SvgBlurredPieceOfCake({
  minAngle,
  maxAngle,
  centerX,
  centerY,
  startRadius,
  stopRadius,
  explodeRatio = 0,
  leftFill,
  rightFill,
  originalSection,
  stroke,
  strokeWidth,
}: SvgBlurredPieceOfCakeProps) {
  const translate = translationFromAngle(
    stopRadius,
    minAngle,
    maxAngle,
    explodeRatio,
  );
  let middleAngle = (originalSection.angleTo + originalSection.minAngle) / 2;
  const secondPart = maxAngle > middleAngle;
  middleAngle = secondPart ? middleAngle : maxAngle;
  return (
    <g transform={`translate(${translate.x} ${translate.y})`}>
      <SvgPieceOfCake
        centerX={centerX}
        centerY={centerY}
        startRadius={startRadius}
        stopRadius={stopRadius}
        maxAngle={middleAngle}
        minAngle={minAngle}
        fill={leftFill}
      />
      {secondPart && (
        <SvgPieceOfCake
          centerX={centerX}
          centerY={centerY}
          startRadius={startRadius}
          stopRadius={stopRadius}
          maxAngle={maxAngle}
          minAngle={middleAngle}
          fill={rightFill}
        />
      )}
      {(stroke || strokeWidth) && (
        <SvgPieceOfCake
          centerX={centerX}
          centerY={centerY}
          startRadius={startRadius}
          stopRadius={stopRadius}
          maxAngle={maxAngle}
          minAngle={minAngle}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
    </g>
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

interface SvgNeedleProps {
  needleCfg: NeedleProps;
  centerX: number;
  centerY: number;
  startRadius: number;
  stopRadius: number;
  explodeRatio: number;
}

function SvgNeedle({
  needleCfg,
  centerX,
  centerY,
  startRadius,
  stopRadius,
  explodeRatio = 0,
}: SvgNeedleProps) {
  const { needle, needleStyle } = needleCfg;
  const translate = translationFromAngle(
    stopRadius,
    needle,
    undefined,
    explodeRatio,
  );
  if (!needleStyle) {
    return (
      <path
        stroke="black"
        strokeWidth={4}
        d={generateLine(
          startRadius,
          stopRadius,
          needle,
          centerX,
          centerY,
          true,
        )}
        transform={`translate(${translate.x} ${translate.y})`}
      />
    );
  } else {
    switch (needleStyle['@class']) {
      case 'SimpleNeedle':
        return (
          <path
            stroke={needleStyle.color ? needleStyle.color : 'black'}
            strokeWidth={
              needleStyle.strokeWidth != null ? needleStyle.strokeWidth : 4
            }
            d={generateLine(
              startRadius,
              stopRadius,
              needle,
              centerX,
              centerY,
              true,
            )}
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
          stopRadius,
          startRadius,
          translate.x,
          translate.y,
        );
      }
    }
  }
}

const filterSections = (
  sections: ComputedPieChartSection[],
  needleCfg?: NeedleProps,
) => {
  const filteredSections = cloneDeep(sections).filter(
    s =>
      // Don't filter if needle is not set
      !needleCfg ||
      !needleCfg.followNeedle ||
      // Keep section if last section as lower angle than needle
      s.minAngle <= needleCfg.needle,
  );

  // Finally, set the last section's angle to the needle's angle if followNeedle is sat
  const lastSection = filteredSections[filteredSections.length - 1];
  if (needleCfg && needleCfg.followNeedle && lastSection) {
    lastSection.angleTo = needleCfg.needle;
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
  radius: number,
  explodeRatio: number = 0,
) => {
  const maxTop =
    (maxAngle >= 90 && minAngle <= 90) ||
    (maxAngle >= -270 && minAngle <= -270) ||
    (maxAngle >= 450 && minAngle >= 90);
  const maxBottom =
    (maxAngle >= 270 && minAngle <= 270) ||
    (maxAngle >= -90 && minAngle <= -90) ||
    (maxAngle >= 630 && minAngle >= 270);
  const maxLeft =
    (maxAngle >= 0 && minAngle <= 0) ||
    (maxAngle >= -360 && minAngle <= -360) ||
    (maxAngle >= 360 && minAngle >= 0);
  const maxRight =
    (maxAngle >= 180 && minAngle <= 180) ||
    (maxAngle >= -180 && minAngle <= -180) ||
    (maxAngle >= 540 && minAngle >= 180);

  const radianMaxAngle = degreeToRadian(maxAngle);
  const radianMinAngle = degreeToRadian(minAngle);

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

  const explodeRadius = radius * explodeRatio;

  const maxHeight = viewBox.size / 2 + explodeRadius;
  const maxWidth = viewBox.size / 2 + explodeRadius;

  const sizeTop = propTop * maxHeight;
  const sizeBottom = propBottom * maxHeight;
  const sizeLeft = propLeft * maxWidth;
  const sizeRight = propRight * maxWidth;

  const gaugeRadius = radius + explodeRadius / 2;
  const gaugeTop = propTop * gaugeRadius;
  const gaugeBottom = propBottom * gaugeRadius;
  const gaugeLeft = propLeft * gaugeRadius;
  const gaugeRight = propRight * gaugeRadius;

  const marginY = maxHeight - radius;
  const marginX = maxWidth - radius;

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

export interface ComputedPieChartSection extends PieChartSection {
  /**
   * minAngle - the angle where the section start
   */
  minAngle: number;
}

interface PieChartState {
  minAngle: number;
  maxAngle: number;
  startRadius: number;
  stopRadius: number;
  holeRatio: number;
  explodeRatio: number;
  sections: ComputedPieChartSection[];
  filteredSections: ComputedPieChartSection[];
  chartSizes: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  gradient: {
    gradients: (JSX.Element | null)[];
    currentId: string;
  };
}

interface HoleRatioAction {
  type: 'HOLE_RATIO';
  holeRatio: number;
}
interface ExplodeRatioAction {
  type: 'EXPLODE_RATIO';
  explodeRatio: number;
}
interface RadiusAction {
  type: 'RADIUS';
  paddingRatio: number;
  holeRatio: number;
}
interface SectionsAction {
  type: 'SECTIONS';
  minAngle: number;
  sections: PieChartSection[];
}
interface FilterSectionsAction {
  type: 'FILTER_SECTIONS';
  sections: ComputedPieChartSection[];
  needleCfg?: NeedleProps;
}
interface ChartSizesAction {
  type: 'CHART_SIZES';
  minAngle: number;
  maxAngle: number;
  radius: number;
  explodeRatio: number;
}
interface GradientAction {
  type: 'GRADIENT';
  blurredSections: ComputedPieChartSection[];
  centerX: number;
  centerY: number;
  startRadius: number;
  stopRadius: number;
}

type PieChartStateAction =
  | HoleRatioAction
  | ExplodeRatioAction
  | RadiusAction
  | SectionsAction
  | FilterSectionsAction
  | ChartSizesAction
  | GradientAction;

/**
 * setPieChartState - the reducer for piechart management
 */
const setPieChartState = (
  oldState: PieChartState,
  action: PieChartStateAction,
) =>
  u(oldState, oldState => {
    switch (action.type) {
      case 'HOLE_RATIO': {
        oldState.holeRatio = boundedValue(action.holeRatio, 0, 1);
        break;
      }
      case 'EXPLODE_RATIO': {
        oldState.explodeRatio = boundedValue(action.explodeRatio, 0);
        break;
      }
      case 'RADIUS': {
        oldState.stopRadius = (viewBox.size * (1 - action.paddingRatio)) / 2;
        oldState.startRadius = oldState.stopRadius * action.holeRatio;
        break;
      }
      case 'SECTIONS': {
        oldState.minAngle = boundedValue(action.minAngle, -360, 360);
        // Generate slices
        let computedSections = action.sections
          .sort((a, b) => a.angleTo - b.angleTo)
          .map((s, i, a) => ({
            ...s,
            minAngle: i === 0 ? oldState.minAngle : a[i - 1].angleTo,
          }));

        // Search max angle
        const maxAngle = computedSections.slice(-1)[0].angleTo;

        // If max angle is greater than 360, rationalize section angles
        const deltaAngle = maxAngle - oldState.minAngle;
        const angleRatio = deltaAngle > 360 ? 360 / deltaAngle : 1;
        oldState.maxAngle =
          deltaAngle > 360 ? oldState.minAngle + 360 : maxAngle;
        computedSections = computedSections.map(s => ({
          ...s,
          minAngle: s.minAngle * angleRatio,
          angleTo: s.angleTo * angleRatio,
        }));
        oldState.sections = computedSections;
        break;
      }
      case 'FILTER_SECTIONS': {
        //Filter the sections if follow needle is active
        oldState.filteredSections = filterSections(
          action.sections,
          action.needleCfg,
        );
        break;
      }
      case 'CHART_SIZES': {
        //Filter the sections if follow needle is active
        oldState.chartSizes = computedHeights(
          action.minAngle,
          action.maxAngle,
          action.radius,
          action.explodeRatio,
        );
        break;
      }
      case 'GRADIENT': {
        //Filter the sections if follow needle is active
        oldState.gradient = generateGradient(
          action.blurredSections,
          action.centerX,
          action.centerY,
          action.startRadius,
          action.stopRadius,
        );

        break;
      }
    }
  });

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
   * paddingRatio - the proportional size of the internal margin (from 0 to 1)
   */
  paddingRatio?: number;
  /**
   * holeRatio - the proportion of the hole in the center of the pie chart (from 0 to 1)
   */
  holeRatio?: number;
  /**
   * explodeRatio - the explode proportion of the pie chart (from 0 to ∞)
   */
  explodeRatio?: number;
  /**
   * blur - blur the color sections
   */
  blur?: boolean;
  /**
   * className - the class of the div around the pie chart
   */
  className?: string;
}

export function PieChart({
  minAngle,
  sections,
  border,
  blur,
  needleCfg,
  paddingRatio = viewBox.initPaddingRatio,
  holeRatio = 0.5,
  explodeRatio = 0,
  className,
}: PieChartProps) {
  const [
    {
      minAngle: computedMinAngle,
      maxAngle: computedMaxAngle,
      holeRatio: computedHoleRatio,
      explodeRatio: computedExplodeRatio,
      startRadius,
      stopRadius,
      sections: computedSections,
      filteredSections,
      chartSizes,
      gradient,
    },
    dispatchStateAction,
  ] = React.useReducer(setPieChartState, {
    minAngle: 0,
    maxAngle: 1,
    holeRatio: 0,
    explodeRatio: 0,
    startRadius: 0,
    stopRadius: 0,
    sections: [],
    filteredSections: [],
    chartSizes: {
      width: viewBox.size,
      height: viewBox.size,
      centerX: viewBox.size / 2,
      centerY: viewBox.size,
    },
    gradient: {
      gradients: [],
      currentId: '',
    },
  });

  if (needleCfg != null && explodeRatio > 0) {
    wwarn(
      'Displaying a needle in an exploded Piechart does not make sense!\n\
      If you really want to do it, it is recommanded to add transparent sections between the colored sections and set explodeRatio to 0',
    );
  }

  React.useEffect(() => {
    dispatchStateAction({ type: 'HOLE_RATIO', holeRatio });
  }, [holeRatio]);

  React.useEffect(() => {
    dispatchStateAction({ type: 'EXPLODE_RATIO', explodeRatio });
  }, [explodeRatio]);

  useDeepChanges(
    {
      type: 'RADIUS',
      holeRatio: computedHoleRatio,
      paddingRatio: boundedValue(paddingRatio, 0, 1),
    },
    dispatchStateAction,
  );

  useDeepChanges({ type: 'SECTIONS', minAngle, sections }, dispatchStateAction);

  useDeepChanges(
    {
      type: 'FILTER_SECTIONS',
      sections: computedSections,
      needleCfg,
    },
    dispatchStateAction,
  );

  useDeepChanges(
    {
      type: 'CHART_SIZES',
      radius: stopRadius,
      explodeRatio: computedExplodeRatio,
      maxAngle: computedMaxAngle,
      minAngle: computedMinAngle,
    },
    dispatchStateAction,
  );

  useDeepChanges(
    {
      type: 'GRADIENT',
      blurredSections: computedSections,
      centerX: chartSizes.centerX,
      centerY: chartSizes.centerY,
      startRadius,
      stopRadius,
    },
    dispatchStateAction,
  );

  // Avoid 0 section
  if (sections.length === 0) {
    return <pre>{`At least one section must be set in the PieChart`}</pre>;
  }
  // Avoid counter clockwise data
  if (computedMaxAngle <= computedMinAngle) {
    return (
      <pre>{`Max angle [${computedMaxAngle}] should be greater than min angle [${computedMinAngle}]`}</pre>
    );
  }

  const circular = computedMaxAngle - computedMinAngle === 360;
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${chartSizes.width} ${chartSizes.height}`}>
        {blur && <defs>{gradient.gradients}</defs>}
        {blur
          ? filteredSections.map((s, i) => (
              <SvgBlurredPieceOfCake
                key={JSON.stringify(s)}
                centerX={chartSizes.centerX}
                centerY={chartSizes.centerY}
                explodeRatio={computedExplodeRatio}
                startRadius={startRadius}
                stopRadius={stopRadius}
                minAngle={s.minAngle}
                maxAngle={s.angleTo}
                leftFill={
                  i === 0 && !circular
                    ? s.fillColor
                    : `Url(#${gradient.currentId + i})`
                }
                rightFill={
                  i === computedSections.length - 1
                    ? circular
                      ? `Url(#${gradient.currentId + 0})`
                      : s.fillColor
                    : `Url(#${gradient.currentId + (i + 1)})`
                }
                originalSection={computedSections[i]}
                stroke={s.border?.color}
                strokeWidth={s.border?.size}
              />
            ))
          : filteredSections.map(s => (
              <SvgPieceOfCake
                key={JSON.stringify(s)}
                centerX={chartSizes.centerX}
                centerY={chartSizes.centerY}
                explodeRatio={computedExplodeRatio}
                startRadius={startRadius}
                stopRadius={stopRadius}
                minAngle={s.minAngle}
                maxAngle={s.angleTo}
                fill={s.fillColor}
                stroke={s.border?.color}
                strokeWidth={s.border?.size}
              />
            ))}
        {border && computedExplodeRatio === 0 && (
          <SvgPieceOfCake
            centerX={chartSizes.centerX}
            centerY={chartSizes.centerY}
            explodeRatio={computedExplodeRatio}
            startRadius={startRadius}
            stopRadius={stopRadius}
            minAngle={computedMinAngle}
            maxAngle={computedMaxAngle}
            stroke={border.color}
            strokeWidth={border.size}
          />
        )}
        {needleCfg && (
          <SvgNeedle
            centerX={chartSizes.centerX}
            centerY={chartSizes.centerY}
            explodeRatio={computedExplodeRatio}
            startRadius={startRadius}
            stopRadius={stopRadius}
            needleCfg={needleCfg}
          />
        )}
      </svg>
    </div>
  );
}
