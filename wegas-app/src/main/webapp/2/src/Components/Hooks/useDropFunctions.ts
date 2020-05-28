import * as React from 'react';
import { wlog } from '../../Helper/wegaslog';

/**
 * useDropFunctions - creates two DOM event functions that can be directly put in an HTML element
 * The utility of this hook is to generate onDragEnter and onDragLeave functions that doesn't trigger on a child element.
 * @param dragIn the function to call when the mouse enters the element the first time
 * @param dragOut the function to call when the mouse gets out of the element
 * @param dragEnd the function to call when the mouse stops dragging the element
 * @param allowReset (use with care) if set, allow the user to reset manually the drop functions with the resetDrop function.
 * It should be used when the component using this hook programmatically changes its content while dragging.
 * If the component content changes while dragging, the drag and drop API will be resetted and the onDragLeave and onDragEnd functions won't be called.
 * @returns {onDragEnter, onDragLeave}
 */
export function useDropFunctions<T extends HTMLElement>(
  dragIn: (event: React.DragEvent<T>) => void,
  dragOut: (event: React.DragEvent<T>) => void,
  dragEnd: (event?: React.DragEvent<T>) => void,
  allowReset?: boolean,
) {
  const dragDepth = React.useRef<number>(0);
  const onDragEnter = React.useCallback(
    (event: React.DragEvent<T>) => {
      if (dragDepth.current === 0) {
        dragIn(event);
      }
      dragDepth.current++;
    },
    [dragIn],
  );

  const onDragLeave = React.useCallback(
    (event: React.DragEvent<T>) => {
      wlog(dragDepth.current);
      dragDepth.current--;
      if (dragDepth.current === 0) {
        dragOut(event);
      }
    },
    [dragOut],
  );

  const onDragEnd = React.useCallback(
    (event: React.DragEvent<T>) => {
      dragDepth.current = 0;
      dragEnd(event);
    },
    [dragEnd],
  );

  const resetDrop = React.useCallback(() => {
    dragDepth.current = 0;
    dragEnd();
  }, [dragEnd]);

  if (!allowReset) {
    return { onDragEnter, onDragLeave, onDragEnd };
  } else {
    return { onDragEnter, onDragLeave, onDragEnd, resetDrop };
  }
}
