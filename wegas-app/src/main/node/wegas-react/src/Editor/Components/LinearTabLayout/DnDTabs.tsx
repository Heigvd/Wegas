import { css } from '@emotion/css';
import * as React from 'react';
import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { Tab, TabComponent, TabProps } from '../../../Components/TabLayout/Tab';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { DropAction } from './DnDTabLayout';

const DROP_SPACE_WIDTH = 100;

function triangleDropStyle(
  canDrop: boolean,
  isOverCurrent: boolean,
  position: 'FIRST' | 'MIDDLE' | 'LAST',
) {
  return css({
    '&:before': {
      content: '""',
      display: 'block',
      width: 0,
      height: 0,
      position: 'absolute',
      zIndex: 10,
      top: '0',
      left:
        position === 'FIRST'
          ? 0
          : position === 'LAST'
          ? DROP_SPACE_WIDTH / 2 - 4 + 'px'
          : 'calc(50% - 4px)',
      border: isOverCurrent
        ? '4px solid ' + themeVar.colors.HighlightColor
        : canDrop
        ? '4px solid ' + themeVar.colors.DisabledColor
        : 'transparent',
      borderRadius: '4px',
    },
    '&:after': {
      content: '""',
      display: 'block',
      width: '2px',
      top: 0,
      bottom: 0,
      position: 'absolute',
      zIndex: 10,
      left:
        position === 'FIRST'
          ? '3px'
          : position === 'LAST'
          ? DROP_SPACE_WIDTH / 2 - 1 + 'px'
          : 'calc(50% - 1px)',
      backgroundColor: isOverCurrent
        ? themeVar.colors.HighlightColor
        : canDrop
        ? themeVar.colors.DisabledColor
        : 'transparent',
    },
  });
}

interface DragTabProps extends TabProps {
  /**
   * label - the name of the draggable item
   */
  label: string;
  /**
   * onDrag - the function to be called when a drag event occures
   */
  onDrag?: (label: string) => void;
  /**
   * dndAcceptType - The token that filter the drop actions
   */
  dndAcceptType: string;
  /**
   * The tab component to use in this component
   */
  CustomTab?: TabComponent;
}

export interface DnDItem {
  label: string;
  type: string;
  children?: React.PropsWithChildren<EmptyObject>['children'];
}

export function DragTab({
  label,
  dndAcceptType,
  children,
  className,
  onClick,
  onDoubleClick,
  onDrag,
  CustomTab = Tab,
}: DragTabProps) {
  const [, drag] = useDrag<DnDItem, unknown, unknown>({
    type: dndAcceptType,
    item: () => {
      onDrag && onDrag(label);
      return {
        label: label,
        type: dndAcceptType,
        children: children,
      };
    },
  });

  if (children === null) {
    return null;
  }
  return (
    <CustomTab
      ref={drag}
      className={className}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </CustomTab>
  );
}

export interface DropTabProps {
  /**
   * dndAcceptType - The token that filter the drop actions
   */
  dndAcceptType: string;
  /**
   * position - the position of the tab in the header
   */
  position: 'FIRST' | 'MIDDLE' | 'LAST';
  /**
   * onDrop - The function to call when a drop occures on this tab
   */
  onDrop?: DropAction;
}

export function DropTab({ dndAcceptType, onDrop, position }: DropTabProps) {
  const [{ isOverCurrent, canDrop }, dropTab] = useDrop({
    accept: dndAcceptType,
    canDrop: () => true,
    drop: onDrop,
    collect: (monitor: DropTargetMonitor) => ({
      isOverCurrent: monitor.isOver({ shallow: false }),
      canDrop: monitor.canDrop(),
      item: monitor.getItem() as DnDItem | null,
    }),
  });

  return (
    <div
      ref={dropTab}
      style={{
        position: 'relative',
        zIndex: 10,
        width:
          position === 'MIDDLE'
            ? DROP_SPACE_WIDTH + 'px'
            : DROP_SPACE_WIDTH / 2 + 'px',
        minWidth:
          position === 'MIDDLE'
            ? DROP_SPACE_WIDTH + 'px'
            : DROP_SPACE_WIDTH / 2 + 'px',
        visibility: isOverCurrent || canDrop ? 'visible' : 'hidden',
        borderRadius:
          position === 'FIRST'
            ? `${themeVar.dimensions.BorderRadius} 0 0 0`
            : position === 'LAST'
            ? `0 ${themeVar.dimensions.BorderRadius} 0 0`
            : 'initial',
        marginLeft:
          position === 'LAST' || position === 'MIDDLE'
            ? '-' + DROP_SPACE_WIDTH / 2 + 'px'
            : '0px',
        marginRight:
          position === 'FIRST' || position === 'MIDDLE'
            ? '-' + DROP_SPACE_WIDTH / 2 + 'px'
            : '0px',
      }}
      className={triangleDropStyle(canDrop, isOverCurrent, position)}
    />
  );
}
