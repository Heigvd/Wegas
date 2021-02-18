import { css } from 'emotion';
import * as React from 'react';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { FlowLine, Process } from './FlowChart';
import { FlowLineHandle, FLOW_HANDLE_SIDE } from './Handles';
import { transitionBoxStyle } from './TransitionFlowLineComponent';

const childrenContainerStyle = (selected: boolean) =>
  css({
    position: 'absolute',
    zIndex: selected ? 1000 : 2,
    ':hover': {
      zIndex: selected ? 1000 : 10,
    },
  });

function defaultSelect() {
  return false;
}

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
   * the process object where the flowline ends
   */
  endProcess: P;
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
   * a callback triggered when a click occures on a flowline
   */
  onClick?: (e: ModifierKeysEvent, sourceProcess: P, flowline: F) => void;
  /**
   * a condition given by the user to see if flowline is selected or not
   */
  isFlowlineSelected?: (sourceProcess: P, flowline: F) => boolean;
}

interface CustomFlowLineProps<F extends FlowLine, P extends Process<F>>
  extends FlowLineProps<F, P> {
  /**
   * the children component that recieve the flowline object
   * allow to customize easily the flowline label style
   */
  children?: (
    flowline: F,
    sourceProcess: P,
    onClick?: (e: ModifierKeysEvent, sourceProcess: P, flowline: F) => void,
    selected?: boolean,
  ) => React.ReactNode;
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
>(props: CustomFlowLineProps<F, P>) {
  if (props.startProcess === props.endProcess) {
    return (
      <CircularFlowLineComponent
        flowline={props.flowline}
        process={props.startProcess}
        isFlowlineSelected={props.isFlowlineSelected}
        onClick={props.onClick}
        positionOffset={props.positionOffset}
        processElement={props.startProcessElement}
      >
        {props.children}
      </CircularFlowLineComponent>
    );
  } else {
    return <CustomStraitFlowLineComponent {...props} />;
  }
}

export function CustomStraitFlowLineComponent<
  F extends FlowLine,
  P extends Process<F>
>({
  startProcessElement,
  endProcessElement,
  startProcess,
  endProcess,
  flowline,
  positionOffset = 0.5,
  onClick,
  isFlowlineSelected = defaultSelect,
  children,
}: CustomFlowLineProps<F, P>) {
  const parent = startProcessElement?.parentElement;
  const parentBox = parent?.getBoundingClientRect();
  const selected = isFlowlineSelected(startProcess, flowline);

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

  const handleRotation = Math.atan2(
    values.arrowEnd.y - values.arrowStart.y,
    values.arrowEnd.x - values.arrowStart.x,
  );

  const startHandlePosition = {
    x: canvasLeft + values.arrowStart.x,
    y: canvasTop + values.arrowStart.y,
  };

  const endHandlePosition = {
    x: canvasLeft + values.arrowEnd.x,
    y: canvasTop + values.arrowEnd.y,
  };

  return (
    <>
      <svg
        style={{
          zIndex: selected ? 1 : 0,
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
            markerHeight="10"
            refX="6"
            refY="5"
            orient="auto"
            fill="transparent"
            stroke="rgb(128, 127, 127)"
          >
            <polyline points="0 0, 6 5, 0 10" />
          </marker>
          <marker
            id="selectedarrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="6"
            refY="5"
            orient="auto"
            fill={'#FFA462'}
            stroke="transparent"
          >
            <polygon points="0 0, 6 5, 0 10" />
          </marker>

          <marker
            id="arrowtail"
            markerWidth="15"
            markerHeight="15"
            refX="5"
            refY="10"
            orient="auto"
            fill="rgb(128, 127, 127)"
          >
            <circle cx="10" cy="10" r="5" />
          </marker>
          <marker
            id="selectedarrowtail"
            markerWidth="15"
            markerHeight="15"
            refX="5"
            refY="10"
            orient="auto"
            fill={'#FFA462'}
          >
            <circle cx="10" cy="10" r="5" />
          </marker>
        </defs>
        <line
          x1={values.arrowStart.x}
          y1={values.arrowStart.y}
          x2={values.arrowEnd.x}
          y2={values.arrowEnd.y}
          style={{
            stroke: 'rgb(128,127,127)',
            strokeWidth: 2,
          }}
          markerStart={`url(#${selected ? 'selectedarrowtail' : 'arrowtail'})`}
          markerEnd={`url(#${selected ? 'selectedarrowhead' : 'arrowhead'})`}
        />
      </svg>
      <FlowLineHandle
        position={startHandlePosition}
        translation={{ x: 0, y: 0.5 }}
        rotation={handleRotation}
        processes={{ sourceProcess: startProcess, targetProcess: endProcess }}
        selected={selected}
        flowline={flowline}
        backward={true}
      />
      <FlowLineHandle
        position={endHandlePosition}
        translation={{ x: 0, y: 0.5 }}
        rotation={handleRotation - Math.PI}
        processes={{ sourceProcess: startProcess }}
        selected={selected}
        flowline={flowline}
        backward={false}
      />
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
        className={childrenContainerStyle(selected)}
        onClick={e => {
          (e.target as HTMLDivElement).focus();
        }}
      >
        {children && children(flowline, startProcess, onClick, selected)}
      </div>
    </>
  );
}

export interface CircularFlowLineProps<
  F extends FlowLine,
  P extends Process<F>
> {
  /**
   * the DOM element from where the flowline starts
   */
  processElement?: HTMLElement;
  /**
   * the process object from where the flowline starts
   */
  process: P;
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
   * a callback triggered when a click occures on a flowline
   */
  onClick?: (e: ModifierKeysEvent, sourceProcess: P, flowline: F) => void;
  /**
   * a condition given by the user to see if flowline is selected or not
   */
  isFlowlineSelected?: (sourceProcess: P, flowline: F) => boolean;
}

interface CustomCircularFlowLineProps<F extends FlowLine, P extends Process<F>>
  extends CircularFlowLineProps<F, P> {
  /**
   * the children component that recieve the flowline object
   * allow to customize easily the flowline label style
   */
  children?: (
    flowline: F,
    sourceProcess: P,
    onClick?: (e: ModifierKeysEvent, sourceProcess: P, flowline: F) => void,
    selected?: boolean,
  ) => React.ReactNode;
}

export function CircularFlowLineComponent<
  F extends FlowLine,
  P extends Process<F>
>({
  processElement,
  process,
  flowline,
  positionOffset = 0.5,
  onClick,
  isFlowlineSelected = defaultSelect,
  children,
}: CustomCircularFlowLineProps<F, P>) {
  const parent = processElement?.parentElement;
  const parentBox = parent?.getBoundingClientRect();
  const processBox = processElement?.getBoundingClientRect();
  const selected = isFlowlineSelected(process, flowline);

  if (processBox == null || parentBox == null) {
    return null;
  }

  const canvasLeft =
    processBox.left - parentBox.left + (parent?.scrollLeft || 0);
  const canvasTop = processBox.top - parentBox.top + (parent?.scrollTop || 0);

  return (
    <>
      <svg
        style={{
          zIndex: selected ? 1 : 0,
          position: 'absolute',
          left: canvasLeft - processBox.width / 2,
          top: canvasTop + processBox.height,
          width: processBox.width * 2,
          height: 200 * positionOffset,
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="15"
            markerHeight="10"
            refX="15"
            refY="5"
            orient="auto"
          >
            <polygon points="0 0, 15 5, 0 10" />
          </marker>
          <marker
            id="selectedarrowhead"
            markerWidth="15"
            markerHeight="10"
            refX="15"
            refY="5"
            orient="auto"
            fill={'orange'}
          >
            <polygon points="0 0, 15 5, 0 10" />
          </marker>

          <marker
            id="arrowtail"
            markerWidth="15"
            markerHeight="10"
            refX="0"
            refY="5"
            orient="auto"
          >
            <polygon points="0 0, 10 0,15 5, 10 10, 0 10, 5 5" />
          </marker>
          <marker
            id="selectedarrowtail"
            markerWidth="15"
            markerHeight="10"
            refX="0"
            refY="5"
            orient="auto"
            fill={'orange'}
          >
            <polygon points="0 0, 10 0,15 5, 10 10, 0 10, 5 5" />
          </marker>
        </defs>
        <path
          d={`M ${(processBox.width * 2) / 3} 0 C ${processBox.width / 2} ${
            200 * positionOffset
          }, ${(processBox.width * 3) / 2} ${200 * positionOffset}, ${
            (processBox.width * 4) / 3
          } 0`}
          style={{
            stroke: 'rgb(128, 127, 127)',
            strokeWidth: 2,
            fill: 'transparent',
          }}
          markerStart={`url(#${selected ? 'selectedarrowtail' : 'arrowtail'})`}
          markerEnd={`url(#${selected ? 'selectedarrowhead' : 'arrowhead'})`}
        />
      </svg>
      <FlowLineHandle
        position={{
          x: canvasLeft + processBox.width / 7 - FLOW_HANDLE_SIDE / 2,
          y: canvasTop + processBox.height,
        }}
        translation={{ x: 0.0, y: 0 }}
        rotation={0}
        processes={{ sourceProcess: process, targetProcess: process }}
        selected={selected}
        flowline={flowline}
        backward={true}
      />
      <FlowLineHandle
        position={{
          x: canvasLeft + processBox.width * (6 / 7) - FLOW_HANDLE_SIDE / 2,
          y: canvasTop + processBox.height,
        }}
        translation={{ x: 0.0, y: 0 }}
        rotation={0}
        processes={{ sourceProcess: process }}
        selected={selected}
        flowline={flowline}
        backward={false}
      />
      <div
        ref={ref => {
          if (ref != null) {
            const labelBox = ref.getBoundingClientRect();
            ref.style.setProperty(
              'left',
              canvasLeft + (processBox.width - labelBox.width) / 2 + 'px',
            );
            ref.style.setProperty(
              'top',
              canvasTop + processBox.height + 150 * positionOffset + 'px',
            );
          }
        }}
        className={childrenContainerStyle(selected)}
        onClick={e => {
          (e.target as HTMLDivElement).focus();
        }}
      >
        {children && children(flowline, process, onClick, selected)}
      </div>
    </>
  );
}

interface StartProcessElement {
  startProcessElement: HTMLElement;
}

interface EndProcessElement {
  endProcessElement: HTMLElement;
}

export function isStartProcessElement(
  processElements: StartProcessElement | EndProcessElement,
): processElements is StartProcessElement {
  return 'startProcessElement' in processElements;
}

export interface TempFlowLineProps {
  /**
   * the DOM element from where the flowline starts
   */
  processElements: StartProcessElement | EndProcessElement;
  /**
   * the position of the dragged handle
   */
  position: XYPosition;
}

export function TempFlowLine({ processElements, position }: TempFlowLineProps) {
  const parent = isStartProcessElement(processElements)
    ? processElements.startProcessElement.parentElement
    : processElements.endProcessElement.parentElement;
  const parentBox = parent!.getBoundingClientRect();

  let startX = position.x + parent!.scrollLeft;
  let startY = position.y + parent!.scrollTop;
  let endX = position.x + parent!.scrollLeft;
  let endY = position.y + parent!.scrollTop;

  if (isStartProcessElement(processElements)) {
    const startProcessBox = processElements.startProcessElement.getBoundingClientRect();
    startX =
      startProcessBox.x +
      startProcessBox.width / 2 -
      parentBox.x +
      parent!.scrollLeft;
    startY =
      startProcessBox.y +
      startProcessBox.height / 2 -
      parentBox.y +
      parent!.scrollTop;
  } else {
    const endProcessBox = processElements.endProcessElement.getBoundingClientRect();
    endX =
      endProcessBox.x +
      endProcessBox.width / 2 -
      parentBox.x +
      parent!.scrollLeft;
    endY =
      endProcessBox.y +
      endProcessBox.height / 2 -
      parentBox.y +
      parent!.scrollTop;
  }

  return (
    <svg
      style={{
        zIndex: -1,
        position: 'absolute',
        // 100% size here doesn't work as parent doesn't have defined size
        width: `${parent!.scrollWidth}px`,
        height: `${parent!.scrollHeight}px`,
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="15"
          markerHeight="10"
          refX="15"
          refY="5"
          orient="auto"
        >
          <polygon points="0 0, 15 5, 0 10" />
        </marker>
        <marker
          id="arrowtail"
          markerWidth="15"
          markerHeight="10"
          refX="0"
          refY="5"
          orient="auto"
        >
          <polygon points="0 0, 10 0,15 5, 10 10, 0 10, 5 5" />
        </marker>
      </defs>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        style={{
          stroke: 'rgb(0,0,0)',
          strokeWidth: 2,
        }}
        markerStart={`url(#arrowtail)`}
        markerEnd={`url(#arrowhead)`}
      />
    </svg>
  );
}

export function DefaultFlowLineComponent<
  F extends FlowLine,
  P extends Process<F>
>(props: FlowLineProps<F, P>) {
  return (
    <CustomFlowLineComponent {...props}>
      {(flowline, startProcess, onClick) => (
        <div
          onClick={e => onClick && onClick(e, startProcess, flowline)}
          className={transitionBoxStyle}
        >
          {flowline.id}
        </div>
      )}
    </CustomFlowLineComponent>
  );
}
