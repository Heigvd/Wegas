import * as React from 'react';
import { css, cx } from 'emotion';
import {
  __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd,
  DropTargetMonitor,
  DropTarget,
  DropTargetConnector,
  DragElementWrapper,
} from 'react-dnd';
import { primaryLight, primaryDark, themeVar } from '../../../Components/Theme';
import { DropAction } from './DnDTabLayout';

export const dndAcceptType = 'DnDTab';

const dropZoneFocus = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.successColor,
  zIndex: 1000,
});

const inactiveDropableTabStyle = css({
  width: '2px',
});

const activeDropableTabStyle = cx(
  css({
    width: '20px',
  }),
  dropZoneFocus,
);

const defaultTabStyle = css({
  display: 'inline-block',
  cursor: 'pointer',
  margin: '0 0.2em',
  borderStyle: 'solid',
  borderWidth: '1px 1px 0 1px',
  padding: '5px',
  verticalAlign: '',
});

export interface DropTabProps {
  /**
   * onDrop - The function to call when a drop occures on this tab
   */
  onDrop?: DropAction;
  /**
   * className - The style to class names to apply on the component
   */
  className?: string;
  /**
   * children - The children in the component
   */
  children?: string | JSX.Element;
}

interface DnDropTabProps extends DropTabProps {
  /**
   * connectDropTarget - The function that wrap the stuff to be rendered (manage dnd event)
   */
  connectDropTarget: DragElementWrapper<DnDropTabProps>;
  /**
   * isOverCurrent - Tells if the drag element is over the current component
   */
  isOverCurrent: boolean;
}
function DropTab({
  className,
  children,
  connectDropTarget,
  isOverCurrent,
}: DnDropTabProps) {
  return connectDropTarget(
    <div
      className={cx(
        className,
        isOverCurrent ? activeDropableTabStyle : inactiveDropableTabStyle,
      )}
    >
      {children}
    </div>,
  );
}

const dropTabTarget = {
  // Calls the onDrop props function when a drop occures
  drop(props: DropTabProps, monitor: DropTargetMonitor) {
    if (props.onDrop) {
      return props.onDrop(monitor.getItem());
    }
  },
};

// Collects these data and offers them to the dropTab
function collect(connect: DropTargetConnector, monitor: DropTargetMonitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOverCurrent: monitor.isOver({ shallow: true }),
  };
}

/**
 * DnDropTab creates a drop target tab for the DnDTabLayout component
 */
export const DnDropTab = DropTarget(dndAcceptType, dropTabTarget, collect)(
  DropTab,
);

interface TabProps {
  /**
   * active - the state of the tab
   */
  active: boolean;
  /**
   * id - the id of the draggable item
   */
  id: number;
  /**
   * children - the content of the tab
   */
  children?: React.ReactChild | null;
  /**
   * onClick - the function to be called when the tab is clicked
   */
  onClick?: () => void;
  /**
   * onDrag - the function to be called when a drag event occures
   */
  onDrag?: (isDragging: boolean, tabId: number) => void;
  /**
   * className - the className to apply on the component
   */
  className?: string;
}

export function Tab(props: TabProps) {
  const [, drag] = dnd.useDrag({
    item: { id: props.id, type: dndAcceptType },
    canDrag: props.onDrag !== undefined,
    begin: () => props.onDrag && props.onDrag(true, props.id),
    end: () => props.onDrag && props.onDrag(false, props.id),
  });

  if (props.children === null) {
    return null;
  }
  return (
    <div
      ref={drag}
      className={cx(
        defaultTabStyle,
        props.className
          ? props.className
          : props.active
          ? primaryDark
          : primaryLight,
      )}
      onClick={() => props.onClick && props.onClick()}
    >
      {props.children}
    </div>
  );
}
