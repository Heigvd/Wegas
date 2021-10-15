import { cx } from '@emotion/css';
import * as React from 'react';
import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import {
  childTabsStyle,
  tabsStyle,
} from '../../../Components/TabLayout/tabLayoutStyles';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { DropAction } from './DnDTabLayout';

interface TabInternalProps {
  /**
   * active - the state of the tab
   */
  active?: boolean;
  /**
   * onClick - the function to be called when the tab is clicked
   */
  onClick?: React.DOMAttributes<HTMLDivElement>['onClick'];
  /**
   * onDoubleClick - the function to be called when the tab is double clicked
   */
  onDoubleClick?: React.DOMAttributes<HTMLDivElement>['onDoubleClick'];
  /**
   * className - the className to apply on the component
   */
  className?: string;
  /**
   * If tab is child of other tabs (styling purpose mainly).
   */
  isChild?: boolean;
}

export type TabProps = React.PropsWithChildren<TabInternalProps>;

export const Tab = React.forwardRef<HTMLDivElement, TabProps>(
  (props: TabProps, ref: React.RefObject<HTMLDivElement>) => {
    const i18nValues = useInternalTranslate(commonTranslations);
    return (
      <div
        ref={ref}
        className={cx(
          props.className
            ? props.className
            : props.isChild
            ? childTabsStyle(props.active)
            : tabsStyle(props.active),
        )}
        onClick={props.onClick}
        onDoubleClick={props.onDoubleClick}
      >
        <React.Suspense fallback={<div>{i18nValues.loading}...</div>}>
          {props.children}
        </React.Suspense>
      </div>
    );
  },
);

Tab.displayName = 'Tab';

export type TabComponent = typeof Tab;

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
  /**
   * If tab is child of other tabs (styling purpose mainly).
   */
  isChild?: boolean;
}

export interface DnDItem {
  label: string;
  type: string;
  children?: React.PropsWithChildren<{}>['children'];
}

export function DragTab({
  label,
  dndAcceptType,
  active,
  children,
  className,
  onClick,
  onDoubleClick,
  onDrag,
  CustomTab = Tab,
  isChild,
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
      active={active}
      className={className}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      isChild={isChild}
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
        zIndex: isOverCurrent ? 10 : 'initial',
        backgroundColor: isOverCurrent
          ? 'red'
          : canDrop
          ? 'salmon'
          : 'transparent',
        width: position === 'MIDDLE' ? '26px' : '16px',
        borderRadius:
          position === 'FIRST'
            ? `${themeVar.dimensions.BorderRadius} 0 0 0`
            : position === 'LAST'
            ? `0 ${themeVar.dimensions.BorderRadius} 0 0`
            : 'initial',
        marginLeft: position === 'FIRST' ? '0px' : '-16px',
        marginRight: position === 'LAST' ? 'initial' : '-10px',
      }}
    />
  );
}
