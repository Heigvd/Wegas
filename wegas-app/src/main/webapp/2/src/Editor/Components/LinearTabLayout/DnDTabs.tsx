import * as React from 'react';
import { css, cx } from 'emotion';
import {
  useDrag,
  DropTargetMonitor,
  DropTarget,
  DropTargetConnector,
  DragElementWrapper,
} from 'react-dnd';
import { primaryLight, primaryDark, themeVar } from '../../../Components/Theme';
import { DropAction } from './DnDTabLayout';

export const dndAcceptType = 'DnDTab';

const dropZoneFocus = css({
  width: '10px',
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.successColor,
  zIndex: 1000,
});

const activeDropableTabStyle = css({
  width: '100px',
  backgroundColor: themeVar.successColor,
});

const defaultTabStyle = css({
  display: 'inline-block',
  cursor: 'pointer',
  margin: '0 0.2em',
  borderStyle: 'solid',
  borderWidth: '1px 1px 0 1px',
  padding: '5px',
  verticalAlign: '',
});

interface TabProps {
  /**
   * active - the state of the tab
   */
  active?: boolean;
  /**
   * children - the content of the tab
   */
  children?: React.ReactChild | null;
  /**
   * onClick - the function to be called when the tab is clicked
   */
  onClick?: () => void;
  /**
   * className - the className to apply on the component
   */
  className?: string;
}

export function Tab(props: TabProps) {
  if (props.children === null) {
    return null;
  }
  return (
    <div
      className={cx(
        defaultTabStyle,
        {
          [primaryDark]: props.active !== undefined && props.active,
          [primaryLight]: !props.active,
        },
        props.className,
      )}
      onClick={props.onClick}
    >
      <React.Suspense fallback={<div>Loading...</div>}>
        {props.children}
      </React.Suspense>
    </div>
  );
}

interface DragTabProps {
  /**
   * active - the state of the tab
   */
  active: boolean;
  /**
   * label - the name of the draggable item
   */
  label: string;
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
  onDrag?: (label: string) => void;
  /**
   * className - the className to apply on the component
   */
  className?: string;
}

export function DragTab(props: DragTabProps) {
  const [, drag] = useDrag({
    item: { label: props.label, type: dndAcceptType },
    begin: () => props.onDrag && props.onDrag(props.label),
  });

  if (props.children === null) {
    return null;
  }
  return (
    <div
      ref={drag}
      className={cx(
        defaultTabStyle,
        {
          [primaryDark]: props.active,
          [primaryLight]: !props.active,
        },
        props.className,
      )}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
}

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
   * canDrop - Tells the component if something is beegin dragged
   */
  canDrop: boolean;
  /**
   * isOverCurrent - Tells if the drag element is over the current component
   */
  isOverCurrent: boolean;
}
function DropTab({
  className,
  children,
  connectDropTarget,
  canDrop,
  isOverCurrent,
}: DnDropTabProps) {
  return connectDropTarget(
    <div
      className={cx(
        className,
        canDrop && dropZoneFocus,
        isOverCurrent && activeDropableTabStyle,
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
    canDrop: monitor.canDrop() && monitor.getItemType() === dndAcceptType,
    isOverCurrent: monitor.isOver({ shallow: true }),
  };
}

/**
 * DnDropTab creates a drop target tab for the DnDTabLayout component
 */
export const DnDropTab = DropTarget(dndAcceptType, dropTabTarget, collect)(
  DropTab,
);
