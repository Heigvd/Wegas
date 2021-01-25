import { css } from 'emotion';
import * as React from 'react';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { themeVar } from '../Style/ThemeVars';
import { FlowLine, Process } from './FlowChart';
import { DefaultProcessHandle, ProcessHandleProps } from './ProcessHandle';

const childrenContainerStyle = css({
  position: 'absolute',
  zIndex: 1,
  ':hover': {
    zIndex: 10,
  },
});

export interface FlowLineProps<F extends FlowLine, P extends Process<F>> {
  /**
   * the DOM element from where the flowline starts
   */
  startProcessElement?: HTMLElement;
  /**
   * the DOM element where the flowline ends
   */
  endProcessElement?: HTMLElement;
  /**
   * the process object from where the flowline starts
   */
  startProcess: P;
  /**
   * the flowline object to display
   */
  flowline: F;
  /**
   * the offset to apply on the flowline
   * allows to display multiple parralel flowlines
   */
  positionOffset?: number;
  /**
   * a handle component that can be dragged to connect the flowline to other (existing or new) processes
   */
  ProcessHandle?: React.FunctionComponent<ProcessHandleProps<F, P>>;
}

interface CustomFlowLineProps<F extends FlowLine, P extends Process<F>>
  extends FlowLineProps<F, P> {
  /**
   * the children component that recieve the flowline object
   * allow to customize easily the flowline label style
   */
  children: (flowline: F) => React.ReactNode;
}

interface Values {
  arrowStart: XYPosition;
  arrowEnd: XYPosition;
  arrowLength: number;
  arrowLeftCorner: XYPosition;
  arrowRightCorner: XYPosition;
  canvasLeft: number;
  canvasTop: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface AxeValues {
  LEFT: Values;
  TOP: Values;
  RIGHT: Values;
  BOTTOM: Values;
}

type Axe = keyof AxeValues;

export function CustomFlowLineComponent<
  F extends FlowLine,
  P extends Process<F>
>({
  startProcessElement,
  endProcessElement,
  startProcess,
  flowline,
  positionOffset = 0.5,
  ProcessHandle = DefaultProcessHandle,
  children,
}: CustomFlowLineProps<F, P>) {
  const parent = startProcessElement?.parentElement;
  const parentBox = parent?.getBoundingClientRect();
  const { arrowLength, axeValues } = React.useMemo(() => {
    if (
      startProcessElement == null ||
      endProcessElement == null ||
      parent == null ||
      parentBox == null
    ) {
      return { arrowLength: undefined, axeValues: undefined };
    }

    const startProcessBox = startProcessElement.getBoundingClientRect();

    const startLeft = startProcessBox.x - parentBox.x;
    const startTop = startProcessBox.y - parentBox.y;
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

    const endProcessBox = endProcessElement.getBoundingClientRect();

    const endLeft = endProcessBox.x - parentBox.x;
    const endTop = endProcessBox.y - parentBox.y;
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

    const canvasTopHorizontal = Math.min(
      startPointRight.y - startHeight / 2,
      endPointLeft.y - endHeight / 2,
    );
    const canvasHeightHorizontal =
      Math.abs(startPointLeft.y - endPointRight.y) +
      Math.max(startHeight, endHeight);
    const canvasWidthLeft = startPointLeft.x - endPointRight.x;
    const canvasWidthRight = endPointLeft.x - startPointRight.x;

    const canvasLeftVertical = Math.min(
      startPointTop.x - startWidth / 2,
      endPointBottom.x - endWidth / 2,
    );
    const canvasWidthVertical =
      Math.abs(startPointTop.x - endPointBottom.x) +
      Math.max(startWidth, endWidth);
    const canvasHeightTop = startPointTop.y - endPointBottom.y;
    const canvasHeightBottom = endPointTop.y - startPointBottom.y;

    const canvasVerticalOffset =
      Math.min(startHeight, endHeight) * (positionOffset - 0.5);
    const canvasHorizontalOffset =
      Math.min(startWidth, endWidth) * (positionOffset - 0.5);

    return {
      arrowLength,
      axeValues: {
        LEFT: {
          arrowStart: {
            x: canvasWidthLeft,
            y: startPointLeft.y - canvasTopHorizontal,
          },
          arrowEnd: {
            x: 0,
            y: endPointRight.y - canvasTopHorizontal,
          },
          arrowLength: leftArrowLength,
          arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y - 5 },
          arrowRightCorner: { x: endPointRight.x + 5, y: endPointRight.y + 5 },
          canvasLeft: endPointRight.x,
          canvasTop: canvasTopHorizontal + canvasVerticalOffset,
          canvasWidth: canvasWidthLeft,
          canvasHeight: canvasHeightHorizontal,
        },
        TOP: {
          arrowStart: {
            x: startPointTop.x - canvasLeftVertical,
            y: canvasHeightTop,
          },
          arrowEnd: { x: endPointBottom.x - canvasLeftVertical, y: 0 },
          arrowLength: topArrowLength,
          arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y + 5 },
          arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y + 5 },
          canvasLeft: canvasLeftVertical + canvasHorizontalOffset,
          canvasTop: endPointBottom.y,
          canvasWidth: canvasWidthVertical,
          canvasHeight: canvasHeightTop,
        },
        RIGHT: {
          arrowStart: {
            x: 0,
            y: startPointRight.y - canvasTopHorizontal,
          },
          arrowEnd: {
            x: canvasWidthRight,
            y: endPointLeft.y - canvasTopHorizontal,
          },
          arrowLength: rightArrowLength,
          arrowLeftCorner: { x: endPointRight.x - 5, y: endPointRight.y + 5 },
          arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y - 5 },
          canvasLeft: startPointRight.x,
          canvasTop: canvasTopHorizontal + canvasVerticalOffset,
          canvasWidth: canvasWidthRight,
          canvasHeight: canvasHeightHorizontal,
        },
        BOTTOM: {
          arrowStart: { x: startPointBottom.x - canvasLeftVertical, y: 0 },
          arrowEnd: {
            x: endPointTop.x - canvasLeftVertical,
            y: canvasHeightBottom,
          },
          arrowLength: bottomArrowLength,
          arrowLeftCorner: { x: endPointRight.x + 5, y: endPointRight.y - 5 },
          arrowRightCorner: { x: endPointRight.x - 5, y: endPointRight.y - 5 },
          canvasLeft: canvasLeftVertical + canvasHorizontalOffset,
          canvasTop: startPointBottom.y,
          canvasWidth: canvasWidthVertical,
          canvasHeight: canvasHeightBottom,
        },
      },
    };
  }, [
    endProcessElement,
    parent,
    parentBox,
    positionOffset,
    startProcessElement,
  ]);

  if (arrowLength == null || axeValues == null) {
    return null;
  }

  const shortestArrow = arrowLength.sort((a, b) => a.length - b.length)[0];
  const values = axeValues[shortestArrow.axe];

  const canvasLeft = values.canvasLeft + (parent?.scrollLeft || 0);
  const canvasTop = values.canvasTop + (parent?.scrollTop || 0);

  return (
    <>
      <svg
        style={{
          zIndex: 0,
          position: 'absolute',
          left: canvasLeft,
          top: canvasTop,
          width: values.canvasWidth,
          height: values.canvasHeight,
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
          x1={values.arrowStart.x}
          y1={values.arrowStart.y}
          x2={values.arrowEnd.x}
          y2={values.arrowEnd.y}
          style={{ stroke: 'rgb(0,0,0)', strokeWidth: 2 }}
          markerEnd="url(#arrowhead)"
        />
      </svg>
      <div
        ref={ref => {
          if (ref != null) {
            const labelBox = ref.getBoundingClientRect();
            ref.style.setProperty(
              'left',
              canvasLeft + (values.canvasWidth - labelBox.width) / 2 + 'px',
            );
            ref.style.setProperty(
              'top',
              canvasTop + (values.canvasHeight - labelBox.height) / 2 + 'px',
            );
          }
        }}
        className={childrenContainerStyle}
        onClick={e => (e.target as HTMLDivElement).focus()}
      >
        {children(flowline)}
        <ProcessHandle sourceProcess={startProcess} flowline={flowline} />
      </div>
    </>
  );
}

const LABEL_WIDTH = 80;
const LABEL_HEIGHT = 35;

const flowLineLabelStyle = css({
  minWidth: `${LABEL_WIDTH}px`,
  minHeight: `${LABEL_HEIGHT}px`,
  backgroundColor: themeVar.Common.colors.HoverColor,
  borderRadius: '10px',
  boxShadow: `5px 5px 5px ${themeVar.Common.colors.HeaderColor}`,
  userSelect: 'none',
  overflow: 'show',
});

export function DefaultFlowLineComponent<
  F extends FlowLine,
  P extends Process<F>
>(props: FlowLineProps<F, P>) {
  return (
    <CustomFlowLineComponent {...props}>
      {flowline => <div className={flowLineLabelStyle}>{flowline.id}</div>}
    </CustomFlowLineComponent>
  );
}
