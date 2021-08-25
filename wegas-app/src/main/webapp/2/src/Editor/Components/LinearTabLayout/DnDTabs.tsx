import * as React from 'react';
import { css, cx } from 'emotion';
import { useDrag, DropTargetMonitor, useDrop } from 'react-dnd';
import { DropAction } from './DnDTabLayout';
import { hidden, flex } from '../../../css/classes';
import { dropZoneFocus } from '../../../Components/Contexts/DefaultDndProvider';
import { tabsStyle, tabStyle } from '../../../Components/Tabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';

// export const dndAcceptType = 'DnDTab';

const dropZone = cx(dropZoneFocus, css({ width: '50px' }));

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
            : cx(tabStyle, tabsStyle(props.isChild, props.active)),
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

interface DnDItem {
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

export interface DropTabProps extends TabProps {
  /**
   * onDrop - The function to call when a drop occures on this tab
   */
  onDrop?: DropAction;
  /**
   * disabled - Allows to disable de component
   */
  disabled?: boolean;
  /**
   * overview - An object to configure how to display the overview and what to display (by default, no overview is displayed)
   */
  overview?: {
    /**
     * position - The position where the overview should be displayed (by default, override the content)
     */
    position?: 'left' | 'right' | 'over';
    /**
     * overviewNode - An element to display when a dragged item is over the target zone
     */
    overviewNode: React.ReactNode;
  };
  /**
   * dndAcceptType - The token that filter the drop actions
   */
  dndAcceptType: string;
  /**
   * The tab component to use in this component
   */
  CustomTab?: TabComponent;
}

export function DropTab({
  dndAcceptType,
  active,
  children,
  className,
  disabled,
  onClick,
  onDrop,
  overview,
  CustomTab = Tab,
}: DropTabProps) {
  const [dropTabProps, dropTab] = useDrop({
    accept: dndAcceptType,
    canDrop: () => true,
    drop: onDrop,
    collect: (mon: DropTargetMonitor) => ({
      isOverCurrent: mon.isOver({ shallow: true }),
      canDrop: mon.canDrop(),
      item: mon.getItem() as DnDItem | null,
    }),
  });

  const [style, setStyle] = React.useState(hidden);

  React.useEffect(() => {
    /* Delaying action on purpose to avoid DnD loosing drop target while dropping */
    setTimeout(() => {
      setStyle(
        dropTabProps.canDrop && dropTabProps.isOverCurrent && !disabled
          ? dropZone
          : hidden,
      );
    }, 50);
  }, [dropTabProps.canDrop, dropTabProps.isOverCurrent, disabled]);

  const renderTab = (): JSX.Element => {
    if (overview) {
      switch (overview.position) {
        case 'left':
          return (
            <>
              <div className={style}>{overview.overviewNode}</div>
              {children}
            </>
          );
        case 'right':
          return (
            <div className={style}>
              {children}
              {overview.overviewNode}
            </div>
          );
        default:
          return <div className={style}>{overview.overviewNode}</div>;
      }
    }
    return <div className={style}>{children}</div>;
  };

  return (
    <CustomTab
      active={active}
      onClick={onClick}
      ref={dropTab}
      className={cx(className, flex)}
    >
      {renderTab()}
    </CustomTab>
  );
}
