import * as React from 'react';
import { DefaultDndProvider } from '../../../../Components/Contexts/DefaultDndProvider';
import { flexColumn, flex } from '../../../../css/classes';
import { cx, css } from 'emotion';
import { IconButton } from '../../../../Components/Inputs/Buttons/IconButton';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { wlog } from '../../../../Helper/wegaslog';
import { classNameOrEmpty } from '../../../../Helper/className';

const treeNodeStyle = cx(flex, flexColumn);
const dropZoneStyle = css({
  border: '1px dashed',
});
const childrenStyle = css({ marginLeft: '2em' });

export interface ItemDescription<T> {
  id: T;
  type: string | symbol;
  parent?: T;
  index?: number;
  source?: React.MutableRefObject<HTMLDivElement | undefined>;
}

interface TreeProps<T> extends ClassAndStyle {
  /**
   * id - the description of the tree - this prop will define the type of the ids used in nodes
   */
  id: TreeNodeProps<T>['id'];
  /**
   * type - the type of the dragged nodes
   */
  type: TreeNodeProps<T>['type'];
  /**
   * children - can either be simple react node or a function allows to link children nodes with the tree
   */
  children: TreeNodeProps<T>['children'];
}

export function Tree<T>({
  id,
  type,
  children,
  className,
  style,
}: TreeProps<T>) {
  return (
    <DefaultDndProvider>
      <TreeNode
        id={id}
        type={type}
        noDrag
        noTitle
        className={className}
        style={style}
      >
        {getParentProps =>
          typeof children === 'function' ? children(getParentProps) : children
        }
      </TreeNode>
    </DefaultDndProvider>
  );
}

interface DropPreviewProps {
  /**
   * height - the height of the preview zone
   */
  height?: React.CSSProperties['height'];
  //   position?: { y: number; edge: 'top' | 'bottom' };
  //   position: 'top' | 'bottom';
  //   boundingRect?: DOMRect | ClientRect;
}

function DropPreview({ /*boundingRect, position*/ height }: DropPreviewProps) {
  //   const height = boundingRect ? boundingRect.height / 2 : 0;
  return (
    <div
      className={dropZoneStyle}
      style={{
        height,
        // position: 'fixed',
        // zIndex: 1000,
        // ...(boundingRect
        //   ? {
        //       width: boundingRect.width,
        //       height: '50px',
        //       top:
        //         position === 'top'
        //           ? boundingRect.top - 25
        //           : boundingRect.top + boundingRect.height - 25,
        //     }
        //   : {}),
      }}
    />
  );
}

interface TreeNodeProps<T> extends ClassAndStyle {
  /**
   * id - the description of the node (it's is the information passed on drag/drop event)
   */
  id: ItemDescription<T>['id'];
  /**
   * title - the content of the node when not expanded
   */
  title?: React.ReactNode;
  /**
   * isExpanded - allow to change the expansion state from outside
   */
  isExpanded?: boolean;
  /**
   * noTitle - hide the title and the carret and force expand the Node
   */
  noTitle?: boolean;
  /**
   * noDrag - prevent from dragging the node
   */
  noDrag?: boolean;
  /**
   * noDrop - prevent from dropping in the node
   */
  noDrop?: boolean;

  /**
   * acceptType - the allowed type/s to drop in node. If not set, the type of the current node is used
   */
  acceptType?: ItemDescription<T>['type'] | ItemDescription<T>['type'][];

  // Can be retrieved with getParentProps() from parent TreeNode
  /**
   * type - the type of the dragged node
   */
  type: ItemDescription<T>['type'];
  /**
   * index - the index of the node
   */
  index?: ItemDescription<T>['index'];
  /**
   * parent - the parent node
   */
  parent?: ItemDescription<T>['parent'];

  /**
   * children - can either be simple react node or a function allows to link children nodes with their parent
   */
  children:
    | React.ReactNode
    | ((
        getParentProps: () => {
          type: ItemDescription<T>['type'];
          index?: ItemDescription<T>['index'];
          parent?: ItemDescription<T>['parent'];
        },
      ) => React.ReactNode);
}

export function TreeNode<T>({
  id,
  type,
  title,
  acceptType,
  isExpanded,
  noTitle,
  noDrag,
  noDrop,
  index,
  parent,
  children,
  className,
  style,
}: TreeNodeProps<T>) {
  const container = React.useRef<HTMLDivElement>();
  const innerContainer = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(isExpanded || noTitle);

  let nbChild = 0;

  const [, drag, preview] = useDrag({
    item: {
      id,
      type,
      index,
      parent,
      source: container,
    },
    canDrag: () => !noDrag,
  });

  const [
    {
      isOverCurrent,
      isOverTop,
      isOverBottom,
      item,
      containerRect,
      yPos,
      canDrop,
    },
    drop,
  ] = useDrop({
    accept: acceptType ? acceptType : type,
    canDrop: () => !noDrop,
    drop: () => {},
    collect: (mon: DropTargetMonitor) => {
      let isOverTop = false;
      let isOverBottom = false;
      const containerRect = innerContainer.current?.getBoundingClientRect();
      const yPos = mon.getClientOffset()?.y;
      const isOverCurrent = mon.isOver({ shallow: true });
      if (containerRect && yPos) {
        const yTop = containerRect.top + containerRect.height * 0.8;
        const yEnd = containerRect.top + containerRect.height;
        isOverTop = isOverCurrent && yPos >= containerRect.top && yPos < yTop;
        isOverBottom = isOverCurrent && yPos >= yTop && yPos <= yEnd;
        wlog({ yPos, yTop, yEnd });
      }
      return {
        isOver: mon.isOver({ shallow: false }),
        isOverCurrent,
        isOverTop,
        isOverBottom,
        canDrop: mon.canDrop(),
        item: mon.getItem() as ItemDescription<T>,
        containerRect,
        yPos,
      };
    },
  });

  React.useEffect(() => {
    setExpanded(isExpanded || noTitle);
  }, [isExpanded, noTitle]);

  function getParentProps() {
    return { index: nbChild++, parent: id, type };
  }

  return (
    <div
      ref={ref => {
        drag(ref);
        drop(ref);
        if (ref) {
          container.current = ref;
        }
      }}
      className={treeNodeStyle + classNameOrEmpty(className)}
      style={style}
    >
      {isOverCurrent && item?.source?.current !== container.current && (
        <DropPreview
          height={item?.source?.current?.getBoundingClientRect().height}
          //   boundingRect={container.current?.getBoundingClientRect()}
          //   position="top"
        />
      )}
      {/* {canDrop && (
              <div
                style={{
                  position: 'absolute',
                  backgroundColor: 'green',
                  opacity: 0.5,
                  height: '50%',
                  width: '100%',
                }}
              />
            )} */}

      <div ref={innerContainer}>
        {!noTitle && (
          <div ref={preview} style={{ position: 'relative' }}>
            {children != null && (
              <IconButton
                icon={expanded ? 'caret-down' : 'caret-right'}
                onClick={() => setExpanded(e => !e)}
              />
            )}
            {index + ' : '}
            {title}
          </div>
        )}
        {children != null && expanded && (
          <div className={childrenStyle}>
            {typeof children === 'function'
              ? children(getParentProps)
              : children}
            <div
              style={{
                width: '100%',
                minHeight: '3px',
                backgroundColor: 'green',
                opacity: 0.5,
              }}
            />
          </div>
        )}
      </div>

      {/* {isOverCurrent && item.source?.current !== container.current && (
        <DropPreview
          boundingRect={container.current?.getBoundingClientRect()}
          position="bottom"
        />
      )} */}
      {/* {isOverBottom && item?.source?.current !== container.current && (
        <DropPreview
          height={item?.source?.current?.getBoundingClientRect().height}
          //   boundingRect={container.current?.getBoundingClientRect()}
          //   position="top"
        />
      )} */}
    </div>
  );
}
