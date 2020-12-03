import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../Style/ThemeVars';
import { XYPosition } from '../Hooks/useMouseEventDnd';

const svgBoxMargin: number = 10;

export interface FlowLine {
  startingStateId: string | number;
  endingStateId: string | number;
}

export interface FlowLines {
  [id: string]: FlowLine;
}

const flowLineStyle = css({
  position: 'absolute',
  backgroundColor: 'rgb(255, 255, 150)',
});

const arrowStyle = css({
  stroke: themeVar.Common.colors.TextColor,
  strokeWidth: 2,
});

export interface FlowLineProps {
  startProcess: HTMLElement;
  startProcessPosition: XYPosition;
  endProcess: HTMLElement;
  endProcessPosition: XYPosition;
}

interface Values {
  arrowStart: XYPosition;
  arrowEnd: XYPosition;
  // arrowLength: number;
  // arrowLeftCorner: XYPosition;
  // arrowRightCorner: XYPosition;
}

interface AxeValues {
  LEFT: Values;
  TOP: Values;
  RIGHT: Values;
  BOTTOM: Values;
}

type Axe = keyof AxeValues;

export function FlowLineComponent({
  startProcess,
  startProcessPosition,
  endProcess,
  endProcessPosition,
}: FlowLineProps) {
  const startProcessBox = startProcess.getBoundingClientRect();

  const startLeft = startProcessPosition.x;
  const startTop = startProcessPosition.y;
  const startWidth = startProcessBox.width;
  const startHeight = startProcessBox.height;

  const startPointLeft: XYPosition = {
    x: startLeft,
    y: startTop + startHeight / 2,
  };
  const startPointTop: XYPosition = {
    x: startLeft + startWidth / 2,
    y: startTop,
  };
  const startPointRight: XYPosition = {
    x: startLeft + startWidth,
    y: startTop + startHeight / 2,
  };
  const startPointBottom: XYPosition = {
    x: startLeft + startWidth / 2,
    y: startTop + startHeight,
  };

  const endProcessBox = endProcess.getBoundingClientRect();

  const endLeft = endProcessPosition.x;
  const endTop = endProcessPosition.y;
  const endWidth = endProcessBox.width;
  const endHeight = endProcessBox.height;

  const endPointLeft: XYPosition = { x: endLeft, y: endTop + endHeight / 2 };
  const endPointTop: XYPosition = { x: endLeft + endWidth / 2, y: endTop };
  const endPointRight: XYPosition = {
    x: endLeft + endWidth,
    y: endTop + endHeight / 2,
  };
  const endPointBottom: XYPosition = {
    x: endLeft + endWidth / 2,
    y: endTop + endHeight,
  };

  const leftArrowLength =
    Math.pow(startPointLeft.x - endPointRight.x, 2) +
    Math.pow(startPointLeft.y - endPointRight.y, 2);
  const topArrowLength =
    Math.pow(startPointTop.x - endPointBottom.x, 2) +
    Math.pow(startPointTop.y - endPointBottom.y, 2);

  const rightArrowLength =
    Math.pow(startPointRight.x - endPointLeft.x, 2) +
    Math.pow(startPointRight.y - endPointLeft.y, 2);

  const bottomArrowLength =
    Math.pow(startPointBottom.x - endPointTop.x, 2) +
    Math.pow(startPointBottom.y - endPointTop.y, 2);

  const arrowLength: { length: number; axe: Axe }[] = [
    { length: leftArrowLength, axe: 'LEFT' },
    { length: topArrowLength, axe: 'TOP' },
    { length: rightArrowLength, axe: 'RIGHT' },
    { length: bottomArrowLength, axe: 'BOTTOM' },
  ];

  const axeValues: AxeValues = {
    LEFT: {
      arrowStart: startPointLeft,
      arrowEnd: endPointRight,
      //arrowLength: leftArrowLength,
      //arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y - 5 },
      //arrowRightCorner: { x: endPointRight.x + 5, y: endPointRight.y + 5 },
    },
    TOP: {
      arrowStart: startPointTop,
      arrowEnd: endPointBottom,
      //arrowLength: topArrowLength,
      //arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y + 5 },
      //arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y + 5 },
    },
    RIGHT: {
      arrowStart: startPointRight,
      arrowEnd: endPointLeft,
      //arrowLength: rightArrowLength,
      //arrowLeftCorner: { x: endPointRight.x - 5, y: endPointRight.y + 5 },
      //arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y - 5 },
    },
    BOTTOM: {
      arrowStart: startPointBottom,
      arrowEnd: endPointTop,
      //arrowLength: bottomArrowLength,
      //arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y - 5 },
      //arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y - 5 },
    },
  };

  const shortestArrow = arrowLength.sort((a, b) => a.length - b.length)[0];
  const values = axeValues[shortestArrow.axe];

  // TODO see if it can be easier to read or compute. for the time being, it is functional

  const isStartMoreLeftThanEnd =
    Math.sign(values.arrowStart.x - values.arrowEnd.x) < 1;
  const isStartUpperThanEnd =
    Math.sign(values.arrowStart.y - values.arrowEnd.y) < 1;
  const arrowBoxLeft =
    Math.min(values.arrowStart.x, values.arrowEnd.x) - svgBoxMargin;
  const arrowBowTop =
    Math.min(values.arrowStart.y, values.arrowEnd.y) - svgBoxMargin;
  const arrowBoxWidth =
    Math.abs(values.arrowStart.x - values.arrowEnd.x) + 2 * svgBoxMargin;
  const arrowBoxHeight =
    Math.abs(values.arrowStart.y - values.arrowEnd.y) + 2 * svgBoxMargin;

  return (
    <>
      <svg
        className={flowLineStyle}
        style={{
          left: arrowBoxLeft,
          top: arrowBowTop,
          width: arrowBoxWidth,
          height: arrowBoxHeight,
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
        <line
          x1={
            isStartMoreLeftThanEnd ? svgBoxMargin : arrowBoxWidth - svgBoxMargin
          }
          y1={
            isStartUpperThanEnd ? svgBoxMargin : arrowBoxHeight - svgBoxMargin
          }
          x2={
            isStartMoreLeftThanEnd ? arrowBoxWidth - svgBoxMargin : svgBoxMargin
          }
          y2={
            isStartUpperThanEnd ? arrowBoxHeight - svgBoxMargin : svgBoxMargin
          }
          className={arrowStyle}
          markerEnd="url(#arrowhead)"
        />
      </svg>
      {/* <path
        d={`M${values.arrowEnd.x} ${values.arrowEnd.y} L${values.arrowLeftCorner.x} ${values.arrowLeftCorner.y} L${values.arrowRightCorner.x} ${values.arrowRightCorner.y} Z`}
      /> */}
      <div
        style={{
          position: 'absolute',
          left: values.arrowStart.x - 5,
          top: values.arrowStart.y - 5,
          backgroundColor: 'green',
          width: '10px',
          height: '10px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: values.arrowEnd.x - 5,
          top: values.arrowEnd.y - 5,
          backgroundColor: 'red',
          width: '10px',
          height: '10px',
        }}
      />
    </>
  );
}
