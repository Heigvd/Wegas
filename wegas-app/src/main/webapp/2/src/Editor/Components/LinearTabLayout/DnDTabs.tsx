import * as React from 'react';
import { css, cx } from 'emotion';
import {
  __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd,
  DropTargetMonitor,
  DropTarget,
  DropTargetConnector,
} from 'react-dnd';
import { primaryLight, primaryDark } from '../../../Components/Theme';
import { DropType } from './LinearLayout';
import { DropAction } from './DnDTabLayout';

export const dndAcceptType = 'DnDTab';

export const defaultDroppableTabStyle = css({
  display: 'inline-block',
});

export const droppableTabStyle = {
  width: '6px',
  borderStyle: 'solid',
  borderWidth: '2px',
};

export const inactiveDropableTabStyle = css({
  ...droppableTabStyle,
  borderColor: 'transparent',
});

export const activeDropableTabStyle = css({
  ...droppableTabStyle,
  borderColor: 'red',
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

export interface DropTabProps {
  onDrop?: DropAction;
  className?: string;
  children?: string | JSX.Element;
}

interface DnDropTabProps extends DropTabProps {
  connectDropTarget: any;
  isOver: boolean;
  isOverCurrent: boolean;
  canDrop: boolean;
  itemType: string;
}

function DropTab(props: DnDropTabProps) {
  return props.connectDropTarget(
    <div
      className={cx(
        defaultDroppableTabStyle,
        props.className,
        props.isOverCurrent && props.canDrop
          ? activeDropableTabStyle
          : inactiveDropableTabStyle,
      )}
    >
      {props.children}
    </div>,
  );
}

const dropTabTarget = {
  canDrop() {
    return true;
  },

  drop(props: DropTabProps, monitor: DropTargetMonitor) {
    if (props.onDrop) {
      return props.onDrop(monitor.getItem());
    }
  },
};

function collect(connect: DropTargetConnector, monitor: DropTargetMonitor) {
  let canDrop: boolean;
  try {
    canDrop = monitor.canDrop();
  } catch (e) {
    canDrop = false;
  }
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: canDrop,
    itemType: monitor.getItemType(),
  };
}

export const DnDropTab = DropTarget(dndAcceptType, dropTabTarget, collect)(
  DropTab,
);

interface TabProps {
  active: boolean;
  id: number;
  children?: React.ReactChild | null;
  onClick?: () => void;
  onDrag?: (isDragging: boolean, tabId: number) => void;
  onDrop?: (type: DropType) => DropAction;
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
      onClick={() => {
        if (props.onClick) {
          props.onClick();
        }
      }}
    >
      {props.children}
    </div>
  );
}
