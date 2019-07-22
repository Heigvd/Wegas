import * as React from 'react';
import { css, cx } from 'emotion';
import { useDrag, DropTargetMonitor, useDrop } from 'react-dnd';
import { primaryLight, primaryDark, themeVar } from '../../../Components/Theme';
import { DropAction } from './DnDTabLayout';

export const dndAcceptType = 'DnDTab';

const hidden = css({
  visibility: 'hidden',
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

export function DragTab(props: DragTabProps) {
  const [, drag] = useDrag({
    item: { label: props.label, type: dndAcceptType, children: props.children },
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
}

export function DropTab(props: DropTabProps) {
  const [dropTabProps, dropTab] = useDrop({
    accept: dndAcceptType,
    canDrop: () => true,
    drop: props.onDrop,
    collect: (mon: DropTargetMonitor) => {
      return {
        isOverCurrent: mon.isOver({ shallow: true }),
        canDrop: mon.canDrop(),
        item: mon.getItem(),
      };
    },
  });

  const [style, setStyle] = React.useState(css());

  React.useEffect(() => {
    setTimeout(() => {
      setStyle(
        props.className
          ? props.className
          : cx(
              dropTabProps.canDrop
                ? dropTabProps.isOverCurrent
                  ? cx(
                      dropTabProps.isOverCurrent && defaultTabStyle,
                      dropTabProps.isOverCurrent && primaryDark,
                    )
                  : dropZoneFocus
                : hidden,
            ),
      );
    }, 100);
  }, [dropTabProps.canDrop, dropTabProps.isOverCurrent, props.className]);

  return (
    <Tab {...props} ref={dropTab} className={style}>
      {dropTabProps.isOverCurrent ? dropTabProps.item.children : props.children}
    </Tab>
  );
}
