import * as React from 'react';

export interface XYPosition {
  x: number;
  y: number;
}

export interface MouseDnDHandler {
  /**
   * onDragStart - is called at the start of the drag sequence
   */
  onDragStart?: (e: MouseEvent, componentPosition: XYPosition) => void;
  /**
   * onDrag - is called everytime the mouse moves during the drag sequence
   */
  onDrag?: (e: MouseEvent, componentPosition: XYPosition) => void;
  /**
   *  onDragEnd - is called at the end of the drag sequence
   * @returns if true, the element will be replaced at its initial position
   */
  onDragEnd?: (e: MouseEvent, componentPosition: XYPosition) => void | boolean;
}

/**
 * useMouseEventDnd - this hooks enables drag an drop on an element witout using HTML5 DnD API.
 * It allows a better management of the drag and drop behaviour and performances
 * @param ref - the reference to the HTML element that have to be dragged
 * @param handlers - {onDragStart, onDrag, onDragEnd} are the event handler callbacks
 */
export function useMouseEventDnd<T extends HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  { onDragStart, onDrag, onDragEnd }: MouseDnDHandler,
) {
  const draggingTarget = React.useRef<T | null>(null);

  const initialPosition = React.useRef<XYPosition>({ x: 0, y: 0 });
  const clickPosition = React.useRef<XYPosition>({ x: 0, y: 0 });
  const lastPosition = React.useRef<XYPosition>({ x: 0, y: 0 });

  const onMouseDown = React.useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      const target = e.target as T;
      draggingTarget.current = target;
      const targetBox = target.getBoundingClientRect();
      const parentBox = target.parentElement?.getBoundingClientRect();
      const x = targetBox.left - (parentBox?.left || 0);
      const y = targetBox.top - (parentBox?.top || 0);
      initialPosition.current = { x, y };
      clickPosition.current = {
        x: e.clientX - targetBox.left,
        y: e.clientY - targetBox.top,
      };

      onDragStart && onDragStart(e, initialPosition.current);
    },
    [onDragStart],
  );
  const onMouseMove = React.useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (draggingTarget.current != null) {
        const target = draggingTarget.current;
        const parentBox = target.parentElement?.getBoundingClientRect();
        const x = e.clientX - (parentBox?.left || 0) - clickPosition.current.x;
        const y = e.clientY - (parentBox?.top || 0) - clickPosition.current.y;
        draggingTarget.current.setAttribute('style', `left:${x}px ;top:${y}px`);
        lastPosition.current = { x, y };
        onDrag && onDrag(e, lastPosition.current);
      }
    },
    [onDrag],
  );
  const onMouseUp = React.useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (draggingTarget.current != null) {
        const reset = onDragEnd && onDragEnd(e, lastPosition.current);
        if (reset) {
          draggingTarget.current.setAttribute(
            'style',
            `left:${initialPosition.current.x}px ;top:${initialPosition.current.y}px`,
          );
        }
        draggingTarget.current = null;
      }
    },
    [onDragEnd],
  );

  React.useEffect(() => {
    const currentElement = ref.current;
    currentElement?.addEventListener('mousedown', onMouseDown);

    // The mousemove and mouseup event is catched in the whole browser window to avoid missing an event when out of the document
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      currentElement?.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseDown, onMouseMove, onMouseUp, ref]);
}
