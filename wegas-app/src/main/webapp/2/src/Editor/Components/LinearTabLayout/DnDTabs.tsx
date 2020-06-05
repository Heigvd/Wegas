import * as React from 'react';
import { css, cx } from 'emotion';
import { useDrag, DropTargetMonitor, useDrop } from 'react-dnd';
import { DropAction } from './DnDTabLayout';
import { hidden, flex } from '../../../css/classes';
import { dropZoneFocus } from '../../../Components/Contexts/DefaultDndProvider';
import {
  activeTabStyle,
  inactiveTabStyle,
  tabStyle,
} from '../../../Components/Tabs';

// export const dndAcceptType = 'DnDTab';

const dropZone = cx(dropZoneFocus, css({ width: '50px' }));

interface TabInternalProps {
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

type TabProps = React.PropsWithChildren<TabInternalProps>;

export const Tab = React.forwardRef(
  (props: TabProps, ref: React.RefObject<HTMLDivElement>) => (
    <div
      ref={ref}
      className={
        props.className
          ? props.className
          : cx(tabStyle, {
              [activeTabStyle]: props.active !== undefined && props.active,
              [inactiveTabStyle]: !props.active,
            })
      }
      onClick={props.onClick}
    >
      <React.Suspense fallback={<div>Loading...</div>}>
        {props.children}
      </React.Suspense>
    </div>
  ),
);

Tab.displayName = 'Tab';

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
   * layoutId - The token that filter the drop actions
   */
  layoutId: string;
}

interface DnDItem {
  label: string;
  type: string;
  children?: React.PropsWithChildren<{}>['children'];
}

export function DragTab(props: DragTabProps) {
  const [, drag] = useDrag<DnDItem, unknown, unknown>({
    item: {
      label: props.label,
      type: props.layoutId,
      children: props.children,
    },
    begin: () => props.onDrag && props.onDrag(props.label),
  });

  if (props.children === null) {
    return null;
  }
  return <Tab ref={drag} {...props} />;
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
   * layoutId - The token that filter the drop actions
   */
  layoutId: string;
}

export function DropTab(props: DropTabProps) {
  const [dropTabProps, dropTab] = useDrop({
    accept: props.layoutId,
    canDrop: () => true,
    drop: props.onDrop,
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
        dropTabProps.canDrop && dropTabProps.isOverCurrent && !props.disabled
          ? dropZone
          : hidden,
      );
    }, 50);
  }, [
    dropTabProps.canDrop,
    dropTabProps.isOverCurrent,
    props.className,
    props.disabled,
  ]);

  const renderTab = (): JSX.Element => {
    if (props.overview) {
      switch (props.overview.position) {
        case 'left':
          return (
            <>
              <div className={style}>{props.overview.overviewNode}</div>
              {props.children}
            </>
          );
        case 'right':
          return (
            <div className={style}>
              {props.children}
              {props.overview.overviewNode}
            </div>
          );
        default:
          return <div className={style}>{props.overview.overviewNode}</div>;
      }
    }
    return <div className={style}>{props.children}</div>;
  };

  return (
    <Tab {...props} ref={dropTab} className={cx(props.className, flex)}>
      {renderTab()}
    </Tab>
  );
}
