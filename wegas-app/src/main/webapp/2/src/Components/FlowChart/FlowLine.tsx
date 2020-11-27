import { css } from 'emotion';
import * as React from 'react';
import { XYPosition } from '../Hooks/useMouseEventDnd';
export interface FlowLine {
  startingStateId: string | number;
  endingStateId: string | number;
}

export interface FlowLines {
  [id: string]: FlowLine;
}

const flowLineStyle = css({
  position: 'absolute',
  backgroundColor: 'yellow',
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
  arrowLength: number;
  arrowLeftCorner: XYPosition;
  arrowRightCorner: XYPosition;
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
      arrowLength: leftArrowLength,
      arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y - 5 },
      arrowRightCorner: { x: endPointRight.x + 5, y: endPointRight.y + 5 },
    },
    TOP: {
      arrowStart: startPointTop,
      arrowEnd: endPointBottom,
      arrowLength: topArrowLength,
      arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y + 5 },
      arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y + 5 },
    },
    RIGHT: {
      arrowStart: startPointRight,
      arrowEnd: endPointLeft,
      arrowLength: rightArrowLength,
      arrowLeftCorner: { x: endPointRight.x - 5, y: endPointRight.y + 5 },
      arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y - 5 },
    },
    BOTTOM: {
      arrowStart: startPointBottom,
      arrowEnd: endPointTop,
      arrowLength: bottomArrowLength,
      arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y - 5 },
      arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y - 5 },
    },
  };

  const shortestArrow = arrowLength.sort((a, b) => a.length - b.length)[0];
  const values = axeValues[shortestArrow.axe];

  const left = Math.min(values.arrowStart.x, values.arrowEnd.x);
  const top = Math.min(values.arrowStart.y, values.arrowEnd.y);
  const width = Math.abs(values.arrowStart.x - values.arrowEnd.x);
  const height = Math.abs(values.arrowStart.y - values.arrowEnd.y);

  return (
    <>
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
        x1={values.arrowStart.x}
        y1={values.arrowStart.y}
        x2={values.arrowEnd.x}
        y2={values.arrowEnd.y}
        style={{ stroke: 'rgb(255,0,0)', strokeWidth: 2 }}
        markerEnd="url(#arrowhead)"
      />
      {/* <path
        d={`M${values.arrowEnd.x} ${values.arrowEnd.y} L${values.arrowLeftCorner.x} ${values.arrowLeftCorner.y} L${values.arrowRightCorner.x} ${values.arrowRightCorner.y} Z`}
      /> */}
      <div
        className={flowLineStyle}
        style={{
          left,
          top,
          width,
          height,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: values.arrowStart.x,
          top: values.arrowStart.y,
          backgroundColor: 'green',
          width: '10px',
          height: '10px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: values.arrowEnd.x,
          top: values.arrowEnd.y,
          backgroundColor: 'red',
          width: '10px',
          height: '10px',
        }}
      />
    </>
  );
}
