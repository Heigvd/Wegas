import * as React from 'react';
import { css, cx } from 'emotion';
import { useDrag, DropTargetMonitor, useDrop } from 'react-dnd';
import { primaryLight, primaryDark, themeVar } from '../../../Components/Theme';
import { DropAction } from './DnDTabLayout';

export const dndAcceptType = 'DnDTab';

const flex = css({
  display: 'flex',
});

const hidden = css({
  display: 'none',
});

const dropZoneFocus = css({
  width: '50px',
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.successColor,
  zIndex: 1000,
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
          : cx(defaultTabStyle, {
              [primaryDark]: props.active !== undefined && props.active,
              [primaryLight]: !props.active,
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
      type: dndAcceptType,
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
}

export function DropTab(props: DropTabProps) {
  const [dropTabProps, dropTab] = useDrop({
    accept: dndAcceptType,
    canDrop: () => true,
    drop: props.onDrop,
    collect: (mon: DropTargetMonitor) => ({
      isOverCurrent: mon.isOver({ shallow: true }),
      canDrop: mon.canDrop(),
      item: mon.getItem() as DnDItem | null,
    }),
  });

  const [style, setStyle] = React.useState(hidden);

  // React.useEffect(() => {
  //   setTimeout(() => {
  //     setStyle(
  //       cx(
  //         props.className
  //           ? props.className
  //           : dropTabProps.canDrop && !props.disabled
  //           ? dropZoneFocus
  //           : hidden,
  //       ),
  //     );
  //   }, 100);
  // }, [
  //   dropTabProps.canDrop,
  //   dropTabProps.isOverCurrent,
  //   props.className,
  //   props.disabled,
  // ]);

  React.useEffect(() => {
    setTimeout(() => {
      setStyle(
        dropTabProps.canDrop && dropTabProps.isOverCurrent && !props.disabled
          ? dropZoneFocus
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
    // if (dropTabProps.isOverCurrent) {
    //   debugger;
    // }
    if (props.overview) {
      // const overviewComp =
      //   dropTabProps.isOverCurrent &&
      //   (props.overview.customOverview
      //     ? props.overview.customOverview
      //     : dropTabProps.item && dropTabProps.item.children);
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
