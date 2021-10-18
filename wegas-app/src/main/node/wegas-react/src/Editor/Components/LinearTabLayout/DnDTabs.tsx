import { css } from '@emotion/css';
import * as React from 'react';
import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { Tab, TabComponent, TabProps } from '../../../Components/TabLayout/Tab';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { DropAction } from './DnDTabLayout';

function triangleDropStyle(canDrop: boolean, isOverCurrent: boolean, position:'FIRST' | 'MIDDLE' | 'LAST') {
  return css({
    '&:before': {
      content: '""',
      display: 'block',
      width: 0,
      height: 0,
      position: 'relative',
      zIndex: 10,
      top: '-20px',
      borderLeft: position ==='FIRST'
      ? 'none'
      : '10px solid transparent',
      borderRight: position ==='LAST'
      ? 'none'
      :'10px solid transparent',
      borderTop: isOverCurrent
      ? '20px solid ' + themeVar.colors.HighlightColor
      : canDrop
      ? '20px solid ' + themeVar.colors.DisabledColor
      : 'transparent',
    }
  })
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
  children?: React.PropsWithChildren<{}>['children'];
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
    item: {
      label: label,
      type: dndAcceptType,
      children: children,
    },
    begin: () => onDrag && onDrag(label),
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
    collect: (mon: DropTargetMonitor) => ({
      isOverCurrent: mon.isOver({ shallow: false }),
      canDrop: mon.canDrop(),
      item: mon.getItem() as DnDItem | null,
    }),
  });

  return (
    <div
      ref={dropTab}
      style={{
        zIndex: 10,
        width: position === 'MIDDLE' ? '26px' : '16px',
        borderRadius:
          position === 'FIRST'
            ? `${themeVar.dimensions.BorderRadius} 0 0 0`
            : position === 'LAST'
            ? `0 ${themeVar.dimensions.BorderRadius} 0 0`
            : 'initial',
        marginLeft: position === 'FIRST' ? '0px' : position === "LAST" ? '-16px' :'-13px',
        marginRight: position === 'LAST' ? '0px' : position === "FIRST" ? '-16px': '-13px',
      }}
      className={triangleDropStyle(canDrop, isOverCurrent, position)}
    />
  );
}
