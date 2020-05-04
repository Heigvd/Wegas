import * as React from 'react';
import {
  DefaultDndProvider,
  dropZoneClass,
} from '../../../../Components/Contexts/DefaultDndProvider';
import { flexColumn, flex, relative } from '../../../../css/classes';
import { cx, css } from 'emotion';
import { IconButton } from '../../../../Components/Inputs/Buttons/IconButton';
import {
  useDrag,
  useDrop,
  DropTargetMonitor,
  DragSourceMonitor,
} from 'react-dnd';
import { classNameOrEmpty } from '../../../../Helper/className';
import { deepDifferent } from '../../../../Components/Hooks/storeHookFactory';

const treeNodeStyle = cx(flex, flexColumn);
const dropZoneStyle = css({
  border: '1px dashed',
  ':hover': {
    backgroundColor: 'red',
  },
});
const childrenStyle = css({ marginLeft: '2em' });

export interface NodeBasicInfo<T> {
  parent?: T;
  index?: number;
}

export interface DropResult<T> {
  id: T;
  source: NodeBasicInfo<T>;
  target: NodeBasicInfo<T>;
}

export interface ItemDescription<T> extends NodeBasicInfo<T> {
  id: T;
  type: string | symbol;
  source?: React.MutableRefObject<HTMLDivElement | undefined>;
  rect?: DOMRect | undefined;
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
  /**
   * onDrop - this function is triggered when something is dropped on a node,
   */
  onDrop?: TreeNodeProps<T>['onDrop'];
}

export function Tree<T>({
  id,
  type,
  onDrop,
  children,
  className,
  style,
}: TreeProps<T>) {
  return (
    <DefaultDndProvider>
      <TreeNode
        id={id}
        type={type}
        onDrop={onDrop}
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
  /**
   * minHeight - the minimum height of the drop preview
   */
}

const DropPreview = React.forwardRef<HTMLDivElement, DropPreviewProps>(
  ({ height }: DropPreviewProps, ref) => {
    return (
      <div
        ref={ref}
        className={dropZoneStyle}
        style={{
          height,
        }}
      />
    );
  },
);

function useTreeViewDrop<T>(
  acceptType: Exclude<TreeNodeProps<T>['acceptType'], undefined>,
  noDrop: TreeNodeProps<T>['noDrop'],
  onDrop?: (result: Omit<DropResult<T>, 'target'>) => void,
) {
  return useDrop<
    ItemDescription<T>,
    void,
    {
      isOverCurrent: boolean;
      canDrop: boolean;
      item: ItemDescription<T> | null;
    }
  >({
    accept: acceptType,
    canDrop: () => !noDrop,
    drop: ({ id, parent, index }) => {
      onDrop &&
        onDrop({
          id,
          source: {
            parent,
            index,
          },
        });
    },
    collect: (mon: DropTargetMonitor) => {
      return {
        isOverCurrent: mon.isOver({ shallow: true }),
        canDrop: mon.canDrop(),
        item: mon.getItem(),
      };
    },
  });
}

interface ParentPassedProps<T> {
  /**
   * id - the id of the parent node
   */
  id: ItemDescription<T>['parent'];
  /**
   * acceptType - the allowed type/s to drop in node. If not set, the type of the current node is used
   */
  acceptType?: ItemDescription<T>['type'] | ItemDescription<T>['type'][];
  /**
   * noDrop - prevent from dropping in the node
   */
  noDrop?: boolean;
}

export type GetParentPropsFn<T> = () => {
  type: ItemDescription<T>['type'];
  index?: ItemDescription<T>['index'];
  onDrop?: (result: DropResult<T>) => void;
  parentProps?: ParentPassedProps<T>;
};

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
   * parentProps - the parent node info
   */
  parentProps?: ParentPassedProps<T>;
  /**
   * onDrop - this function is triggered when something is dropped on a node,
   */
  onDrop?: (result: DropResult<T>) => void;

  /**
   * children - can either be simple react node or a function allows to link children nodes with their parent
   */
  children:
    | React.ReactNode
    | ((getParentNode: GetParentPropsFn<T>) => React.ReactNode);
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
  parentProps,
  onDrop,
  children,
  className,
  style,
}: TreeNodeProps<T>) {
  const container = React.useRef<HTMLDivElement>();
  const innerContainer = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(isExpanded || noTitle);
  const [showUpperDropZone, setShowUpperDropZone] = React.useState(false);

  let nbChild = 0;

  const [{ isDragging }, drag, preview] = useDrag<
    ItemDescription<T>,
    void,
    { isDragging: boolean }
  >({
    item: {
      id,
      type,
      index,
      parent: parentProps?.id,
      source: container,
      rect: container.current?.getBoundingClientRect(),
    },
    canDrag: () => !noDrag,
    collect: (mon: DragSourceMonitor) => ({
      isDragging: mon.isDragging(),
    }),
  });

  const [{ canDrop, item }, drop] = useDrop<
    ItemDescription<T>,
    void,
    {
      canDrop: boolean;
      item: ItemDescription<T> | null;
    }
  >({
    accept: acceptType || type,
    canDrop: () => !noDrop,
    hover: (_item, mon) => {
      // wlog({ accept: acceptType || type, type: item.type, noDrop });

      const rect = container.current?.getBoundingClientRect();
      const posY = mon.getClientOffset()?.y;
      setShowUpperDropZone(
        mon.isOver({ shallow: true }) &&
          rect != null &&
          posY != null &&
          posY < rect.top + rect.height / 2,
      );
    },
    collect: (mon: DropTargetMonitor) => ({
      isOverCurrent: mon.isOver({ shallow: true }),
      canDrop: mon.canDrop(),
      item: mon.getItem(),
    }),
  });

  // const [{ isOverCurrent, canDrop, item }, drop] = useTreeViewDrop<T>(
  //   acceptType ? acceptType : type,
  //   noDrop,
  //   () => {},
  //   container,
  // );

  const [{ isOverCurrent: isOverUp }, dropUp] = useTreeViewDrop<T>(
    parentProps?.acceptType || type,
    parentProps?.noDrop,
    res =>
      onDrop &&
      onDrop({
        ...res,
        target: {
          parent: parentProps?.id,
          index,
        },
      }),
  );

  // const [{ isOverCurrent: isOverDown }, dropDown] = useTreeViewDrop<T>(
  //   parentProps?.acceptType || type,
  //   parentProps?.noDrop,
  //   res => {
  //     wlog({
  //       ...res,
  //       target: {
  //         parent: id,
  //         index: nbChild,
  //       },
  //     });
  //     onDrop &&
  //       onDrop({
  //         ...res,
  //         target: {
  //           parent: parentProps?.id,
  //           index: (index || 0) + 1,
  //         },
  //       });
  //   },
  // );

  const [{ isOverCurrent: isOverDown }, dropDown] = useTreeViewDrop<T>(
    acceptType ? acceptType : type,
    noDrop,
    res => {
      // wlog({
      //   ...res,
      //   target: {
      //     parent: id,
      //     index: nbChild,
      //   },
      // });
      onDrop &&
        onDrop({
          ...res,
          target: {
            parent: id,
            index: nbChild,
          },
        });
    },
  );

  React.useEffect(() => {
    setExpanded(isExpanded || noTitle);
  }, [isExpanded, noTitle]);

  function getParentProps(): ReturnType<GetParentPropsFn<T>> {
    return {
      index: nbChild++,
      type,
      onDrop,
      parentProps: {
        id,
        acceptType,
        noDrop,
      },
    };
  }

  return (
    <div
      ref={ref => {
        if (ref) {
          container.current = ref;
          drag(ref);
          drop(ref);
        }
      }}
      className={treeNodeStyle + classNameOrEmpty(className)}
      style={style}
    >
      {!isDragging &&
        (showUpperDropZone || isOverUp) &&
        deepDifferent(item?.id, parentProps?.id) && (
          <div
            ref={dropUp}
            className={dropZoneClass(isOverUp)}
            style={{
              // height: item?.rect?.height,
              height: item?.source?.current?.getBoundingClientRect().height,
            }}
          />
        )}
      <div ref={innerContainer}>
        {!noTitle && (
          <div ref={preview} className={cx(flex, relative)}>
            {children != null && (
              <IconButton
                icon={expanded ? 'caret-down' : 'caret-right'}
                onClick={() => setExpanded(e => !e)}
              />
            )}
            {title}
          </div>
        )}
        {children != null && expanded && (
          <div className={noTitle ? undefined : childrenStyle}>
            {typeof children === 'function'
              ? children(getParentProps)
              : children}
            {canDrop && deepDifferent(item?.id, id) && (
              <div
                ref={dropDown}
                style={{
                  minHeight: isOverDown ? item?.rect?.height : '5px',
                  // backgroundColor: 'green',
                  // height: item?.rect?.height,
                }}
                className={dropZoneClass(isOverDown)}
              >
                {!isDragging && isOverDown && (
                  <DropPreview
                    height={
                      item?.source?.current?.getBoundingClientRect().height
                    }
                    // height={item?.rect?.height}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
