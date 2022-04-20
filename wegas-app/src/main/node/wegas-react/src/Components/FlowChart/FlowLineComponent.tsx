import { css, cx } from '@emotion/css';
import * as React from 'react';
import { classNameOrEmpty } from '../../Helper/className';
import { XYPosition } from '../Hooks/useMouseEventDnd';
import { isActionAllowed } from '../PageComponents/tools/options';
import { themeVar } from '../Theme/ThemeVars';
import { FlowLine, Process } from './FlowChart';
import { FlowLineHandle, FLOW_HANDLE_SIDE } from './Handles';
import {
  transitionBoxActionStyle,
  transitionBoxStyle,
} from './TransitionFlowLineComponent';

const childrenContainerStyle = (selected: boolean) =>
  css({
    position: 'absolute',
    zIndex: selected ? 1000 : 2,
    ':hover': {
      zIndex: selected ? 1000 : 10,
    },
  });

export function defaultSelect() {
  return false;
}

export function ArrowDefs() {
  return (
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
        className={hoverLineStyle}
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
        fill={themeVar.colors.HighlightColor}
        stroke="transparent"
      >
        <polygon points="0 0, 6 5, 0 10" />
      </marker>
      <marker
        id="selectedarrowtail"
        markerWidth="15"
        markerHeight="15"
        refX="5"
        refY="10"
        orient="auto"
        fill={themeVar.colors.HighlightColor}
        stroke="transparent"
      >
        <circle cx="10" cy="10" r="5" />
      </marker>
    </defs>
  );
}

const arrowCSS = (zoom: number) => ({
  stroke: 'rgb(128,127,127)',
  strokeWidth: 2 * zoom,
  fill: 'none',
});

const hoverLineStyle = css({
  '&:hover': {
    stroke: themeVar.colors.PrimaryColor,
  },
});

export interface FlowLineProps {
  /**
   * the points of the flowline
   */
  flowlineValues: FlowLineCoordinates;
  /**
   * is the flowline selected
   */
  selected?: boolean;
  /**
   * controls the size of the stroke
   */
  zoom: number;
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

export interface FlowLineCoordinates {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface FlowLineHandlesValues {
  startPosition: XYPosition;
  endPosition: XYPosition;
  startRotation: number;
  endRotation: number;
  translation: XYPosition;
}

export interface FlowLineLabelValues {
  position: (labelBox: DOMRect) => XYPosition;
}

export interface FlowLineComputedValues {
  flowlineValues: FlowLineCoordinates;
  handlesValues: FlowLineHandlesValues;
  labelValues: FlowLineLabelValues;
}

export function computeFlowlineValues(
  startProcessElement: HTMLElement | undefined,
  endProcessElement: HTMLElement | undefined,
  circular: boolean,
  zoom: number,
  positionOffset: number = 0.5,
): FlowLineComputedValues | undefined {
  const parent = startProcessElement?.parentElement;
  const parentBox = parent?.getBoundingClientRect();
  if (
    startProcessElement == null ||
    endProcessElement == null ||
    parent == null ||
    parentBox == null
  ) {
    return undefined;
  }

  const startProcessBox = startProcessElement.getBoundingClientRect();
  const endProcessBox = endProcessElement.getBoundingClientRect();

  const displayValues =
    startProcessBox.bottom +
    startProcessBox.height +
    startProcessBox.left +
    startProcessBox.right +
    startProcessBox.top +
    startProcessBox.width +
    startProcessBox.x +
    startProcessBox.y +
    endProcessBox.bottom +
    endProcessBox.height +
    endProcessBox.left +
    endProcessBox.right +
    endProcessBox.top +
    endProcessBox.width +
    endProcessBox.x +
    endProcessBox.y;
  if (displayValues === 0) {
    throw Error('fail to display');
  }

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

  const axeValues = {
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
  };

  const shortestArrow = arrowLength.sort((a, b) => a.length - b.length)[0];
  const values = axeValues[shortestArrow.axe];

  const canvasLeft = values.canvasLeft + (parent?.scrollLeft || 0);
  const canvasTop = values.canvasTop + (parent?.scrollTop || 0);

  const circularCanvasLeft =
    startProcessBox.left - parentBox.left + (parent?.scrollLeft || 0);
  const circularCanvasTop =
    startProcessBox.top - parentBox.top + (parent?.scrollTop || 0);

  const handleRotation = Math.atan2(
    values.arrowEnd.y - values.arrowStart.y,
    values.arrowEnd.x - values.arrowStart.x,
  );
  const handleStartRotation = circular ? 0 : handleRotation;
  const handleEndRotation = circular ? 0 : handleRotation - Math.PI;

  const handleTranslation = circular ? { x: 0, y: 0 } : { x: 0, y: 0.5 };

  const startHandlePosition = circular
    ? {
        x:
          circularCanvasLeft + startProcessBox.width / 7 - FLOW_HANDLE_SIDE / 2,
        y: circularCanvasTop + startProcessBox.height,
      }
    : {
        x: canvasLeft + values.arrowStart.x,
        y: canvasTop + values.arrowStart.y,
      };

  const endHandlePosition = circular
    ? {
        x:
          circularCanvasLeft +
          startProcessBox.width * (6 / 7) -
          FLOW_HANDLE_SIDE / 2,
        y: circularCanvasTop + startProcessBox.height,
      }
    : {
        x: canvasLeft + values.arrowEnd.x,
        y: canvasTop + values.arrowEnd.y,
      };

  function labelPosition(labelBox: DOMRect): XYPosition {
    return circular
      ? {
          x: circularCanvasLeft + (startProcessBox.width - labelBox.width) / 2,
          y: canvasTop + startProcessBox.height + 150 * zoom * positionOffset,
        }
      : {
          x:
            Math.min(endHandlePosition.x, startHandlePosition.x) +
            (Math.abs(endHandlePosition.x - startHandlePosition.x) -
              labelBox.width) /
              2,
          y:
            Math.min(endHandlePosition.y, startHandlePosition.y) +
            (Math.abs(endHandlePosition.y - startHandlePosition.y) -
              labelBox.height) /
              2,
        };
  }

  const flowlineValues = {
    x1: values.arrowStart.x + canvasLeft,
    y1: values.arrowStart.y + canvasTop,
    x2: values.arrowEnd.x + canvasLeft,
    y2: values.arrowEnd.y + canvasTop,
  };

  const handlesValues: FlowLineHandlesValues = {
    startPosition: startHandlePosition,
    endPosition: endHandlePosition,
    startRotation: handleStartRotation,
    endRotation: handleEndRotation,
    translation: handleTranslation,
  };

  const labelValues: FlowLineLabelValues = {
    position: labelPosition,
  };

  return { flowlineValues, handlesValues, labelValues };
}

export function StraitFlowLine({
  flowlineValues,
  selected,
  zoom,
}: FlowLineProps) {
  return (
    <line
      {...flowlineValues}
      {...arrowCSS(zoom)}
      markerStart={`url(#${selected ? 'selectedarrowtail' : ''})`}
      markerEnd={`url(#${selected ? 'selectedarrowhead' : 'arrowhead'})`}
      className={hoverLineStyle}
    />
  );
}

interface FlowLineHandlesProps<F extends FlowLine, P extends Process<F>>
  extends FlowLineHandlesValues {
  startProcess: P;
  endProcess: P;
  flowline: F;
  selected: boolean;
}

export function FlowLineHandles<F extends FlowLine, P extends Process<F>>({
  startPosition,
  endPosition,
  startRotation,
  endRotation,
  translation,
  startProcess,
  endProcess,
  flowline,
  selected,
}: FlowLineHandlesProps<F, P>) {
  return (
    <>
      <FlowLineHandle
        position={startPosition}
        translation={translation}
        rotation={startRotation}
        processes={{
          sourceProcess: startProcess,
          targetProcess: endProcess,
        }}
        selected={selected}
        flowline={flowline}
        backward={true}
      />
      <FlowLineHandle
        position={endPosition}
        translation={translation}
        rotation={endRotation}
        processes={{ sourceProcess: startProcess }}
        selected={selected}
        flowline={flowline}
        backward={false}
      />
    </>
  );
}

interface CircularFlowLineProps {
  processElement: HTMLElement | undefined;
  positionOffset?: number;
  selected: boolean;
  zoom: number;
}

export function CircularFlowLine({
  processElement,
  positionOffset = 0.5,
  selected,
  zoom,
}: CircularFlowLineProps) {
  const parent = processElement?.parentElement;
  if (processElement == null || parent == null) {
    return null;
  }

  const processBox = processElement.getBoundingClientRect();
  const parentBox = parent.getBoundingClientRect();
  const canvasLeft =
    processBox.left -
    parentBox.left +
    (parent?.scrollLeft || 0) -
    processBox.width / 2;
  const canvasTop =
    processBox.top -
    parentBox.top +
    (parent?.scrollTop || 0) +
    processBox.height;

  return (
    <path
      d={`M ${canvasLeft + (processBox.width * 2) / 3} ${canvasTop} C ${
        canvasLeft + processBox.width / 2
      } ${canvasTop + 200 * zoom * positionOffset}, ${
        canvasLeft + (processBox.width * 3) / 2
      } ${canvasTop + 200 * zoom * positionOffset}, ${
        canvasLeft + (processBox.width * 4) / 3
      } ${canvasTop}`}
      {...arrowCSS(zoom)}
      markerStart={`url(#${selected ? 'selectedarrowtail' : ''})`}
      markerEnd={`url(#${selected ? 'selectedarrowhead' : 'arrowhead'})`}
    />
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
  /**
   * controls the size of the stroke
   */
  zoom: number;
}

export function TempFlowLine({
  processElements,
  position,
  zoom,
}: TempFlowLineProps) {
  const parent = isStartProcessElement(processElements)
    ? processElements.startProcessElement.parentElement
    : processElements.endProcessElement.parentElement;
  const parentBox = parent!.getBoundingClientRect();

  let startX = position.x + parent!.scrollLeft;
  let startY = position.y + parent!.scrollTop;
  let endX = position.x + parent!.scrollLeft;
  let endY = position.y + parent!.scrollTop;

  if (isStartProcessElement(processElements)) {
    const startProcessBox =
      processElements.startProcessElement.getBoundingClientRect();
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
    const endProcessBox =
      processElements.endProcessElement.getBoundingClientRect();
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
    <line
      x1={startX}
      y1={startY}
      x2={endX}
      y2={endY}
      {...arrowCSS(zoom)}
      //markerStart={`url(#arrowtail)`}
      markerEnd={`url(#arrowhead)`}
    />
  );
}

export interface FlowLineLabelProps extends FlowLineLabelValues, ClassStyleId {
  /**
   * a condition given by the user to see if flowline is selected or not
   */
  selected: boolean;
  /**
   * Will position the label relative to this element
   */
  mainElement?: React.MutableRefObject<HTMLElement | null>;
}

export function CustomFlowLineComponent({
  position,
  children,
  selected,
  mainElement,
  zoom,
  className,
  style,
  id,
}: React.PropsWithChildren<FlowLineLabelProps> & { zoom: number }) {
  const flowLineContainer = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const positionnedElement = (mainElement ? mainElement : flowLineContainer)
      ?.current;

    if (positionnedElement && flowLineContainer.current) {
      const labelBox = positionnedElement.getBoundingClientRect();
      const values = position(labelBox);
      flowLineContainer.current.style.setProperty('left', values.x + 'px');
      flowLineContainer.current.style.setProperty('top', values.y + 'px');
    }
  });

  return (
    <div
      id={id}
      ref={flowLineContainer}
      className={childrenContainerStyle(selected) + classNameOrEmpty(className)}
      style={{
        ...style,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
    >
      {children}
    </div>
  );
}

export interface FlowLineComponentProps<
  F extends FlowLine,
  P extends Process<F>,
> extends FlowLineLabelProps,
    DisabledReadonly {
  /**
   * the process object from where the flowline starts
   */
  startProcess: P;
  /**
   * the process object where the flowline ends
   */
  flowline: F;
  /**
   * the offset to apply on the flowline
   * allows to display multiple parralel flowlines
   */
  onClick?: (e: ModifierKeysEvent, sourceProcess: P, flowline: F) => void;
  /**
   * allows control the size and position of the component
   */
  zoom: number;
}

export function DefaultFlowLineComponent<
  F extends FlowLine,
  P extends Process<F>,
>({
  onClick,
  startProcess,
  flowline,
  disabled,
  readOnly,
  selected,
  position,
  zoom,
}: FlowLineComponentProps<F, P>) {
  return (
    <CustomFlowLineComponent
      selected={selected}
      position={position}
      zoom={zoom}
    >
      <div
        onClick={e =>
          onClick &&
          isActionAllowed({
            disabled: disabled,
            readOnly: readOnly,
          }) &&
          onClick(e, startProcess, flowline)
        }
        className={cx(transitionBoxStyle, {
          [transitionBoxActionStyle]: isActionAllowed({
            readOnly: readOnly,
            disabled: disabled,
          }),
        })}
      >
        {flowline.id}
      </div>
    </CustomFlowLineComponent>
  );
}
