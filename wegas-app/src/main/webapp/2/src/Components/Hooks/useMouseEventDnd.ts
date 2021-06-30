import * as React from 'react';

function forbidClick(e: MouseEvent) {
  e.stopPropagation();
}

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
  onDragEnd?: (
    e: MouseEvent,
    componentPosition: XYPosition,
    targetId: string | null,
  ) => void | boolean;
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
  prenventClick?: boolean,
  disabled?: boolean,
  zoom: number = 1,
) {
  const draggingTarget = React.useRef<T | null>(null);
  const draggingStarted = React.useRef(false);

  const initialPosition = React.useRef<XYPosition>({ x: 0, y: 0 });
  const clickPosition = React.useRef<XYPosition>({ x: 0, y: 0 });
  const lastPosition = React.useRef<XYPosition>({ x: 0, y: 0 });

  const ghostElement = React.useRef<T>();

  const onMouseDown = React.useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (
        !disabled &&
        ref.current != null &&
        !(e.target as HTMLElement).getAttribute('data-nodrag')
      ) {
        const target = ref.current as T;

        draggingTarget.current = target;
        const targetBox = target.getBoundingClientRect();
        const parentBox = target.parentElement?.getBoundingClientRect();
        const x = (targetBox.left - (parentBox?.left || 0)) / zoom;
        const y = (targetBox.top - (parentBox?.top || 0)) / zoom;
        initialPosition.current = { x: x, y: y };
        clickPosition.current = {
          x: (e.clientX - targetBox.left) / zoom,
          y: (e.clientY - targetBox.top) / zoom,
        };

        // Create a ghost of the dragged element to avoid scroll bars to schrink when moving up or left
        ghostElement.current = target.cloneNode(true) as T;
        ghostElement.current.style.setProperty('opacity', '0');
        ghostElement.current.style.setProperty('z-index', '-10000');
        target.after(ghostElement.current);

        onDragStart && onDragStart(e, initialPosition.current);
      }
    },
    [disabled, onDragStart, ref, zoom],
  );
  const onMouseMove = React.useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (!disabled && draggingTarget.current != null) {
        if (prenventClick) {
          document.body.addEventListener('click', forbidClick);
        }
        draggingStarted.current = true;
        const target = draggingTarget.current;
        const parent = target.parentElement;

        if (parent != null) {
          const parentBox = parent.getBoundingClientRect();
          const x =
            e.clientX +
            (target.parentElement?.scrollLeft || 0) -
            (parentBox?.left || 0) -
            clickPosition.current.x;
          const y =
            e.clientY +
            (target.parentElement?.scrollTop || 0) -
            (parentBox?.top || 0) -
            clickPosition.current.y;

          draggingTarget.current.style.setProperty('left', `${x}px`);
          draggingTarget.current.style.setProperty('top', `${y}px`);
          lastPosition.current = { x, y };
          onDrag && onDrag(e, lastPosition.current);
        }
      }
    },
    [disabled, onDrag, prenventClick],
  );
  const onMouseUp = React.useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      const target = e.target as T;

      // Removing ghost after moving element
      if (ghostElement.current != null) {
        ghostElement.current.remove();
      }

      if (
        !disabled &&
        draggingStarted.current &&
        draggingTarget.current != null
      ) {
        const reset =
          onDragEnd &&
          onDragEnd(e, lastPosition.current, target.getAttribute('data-id'));
        if (reset) {
          draggingTarget.current.style.setProperty(
            'left',
            `${initialPosition.current.x}px`,
          );
          draggingTarget.current.style.setProperty(
            'top',
            `${initialPosition.current.y}px`,
          );
        }
      }
      draggingTarget.current = null;
      draggingStarted.current = false;

      if (prenventClick) {
        setTimeout(() => {
          document.body.removeEventListener('click', forbidClick);
        }, 50);
      }
    },
    [disabled, onDragEnd, prenventClick],
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
