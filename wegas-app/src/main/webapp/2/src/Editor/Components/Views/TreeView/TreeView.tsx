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
import { useDebounce } from '../../../../Components/Hooks/useDebounce';

const treeNodeStyle = cx(flex, flexColumn);
const childrenStyle = css({ marginLeft: '2em' });

export interface NodeBasicInfo<T> {
  parent?: T;
  index?: number;
}

export interface DropResult<T> {
  item: {};
  id: T;
  source: NodeBasicInfo<T>;
  target: NodeBasicInfo<T>;
}

export interface ItemDescription<T> extends NodeBasicInfo<T> {
  id: T;
  type: string | symbol;
  source?: React.MutableRefObject<HTMLDivElement | undefined>;
  //rect?: DOMRect | undefined;
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

interface DropPreviewProps extends ClassAndStyle {
  /**
   * height - the height of the preview zone
   */
  height?: React.CSSProperties['height'];
  /**
   * minHeight - the minimum height of the drop preview
   */
  minHeight?: React.CSSProperties['minHeight'];
}

const DropPreview = React.forwardRef<HTMLDivElement, DropPreviewProps>(
  ({ height, minHeight, className, style }: DropPreviewProps, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          height,
          minHeight,
          ...style,
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
    drop: ({ id, parent, index }, mon) => {
      onDrop &&
        onDrop({
          item: mon.getItem(),
          id,
          source: {
            parent,
            index,
          },
        });
    },
    collect: (mon: DropTargetMonitor) => {
      const itemType = mon.getItem()?.type;
      return {
        isOverCurrent:
          (itemType != null &&
            (typeof acceptType === 'string' ||
              typeof acceptType === 'symbol') &&
            acceptType === itemType) ||
          (Array.isArray(acceptType) &&
            acceptType.includes(itemType) &&
            mon.isOver({ shallow: true })),
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
   * draggingMonitor - object that allows monitoring the dragged element over the tree
   */
  draggingMonitor?: {
    /**
     * isDragging - called every time a element with monitorTypes is dragged
     */
    isDragging: (dragging: boolean) => void;
    /**
     * monitorTypes - the types of element to monitor
     */
    monitorTypes: (string | symbol)[];
  };
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
  draggingMonitor,
  children,
  className,
  style,
}: TreeNodeProps<T>) {
  const container = React.useRef<HTMLDivElement>();
  const innerContainer = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(isExpanded || noTitle);
  const [showUpperDropZone, setShowUpperDropZone] = React.useState(false);

  let nbChild = 0;

  //wlog(JSON.stringify(acceptType));

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
    },
    canDrag: () => !noDrag,
    collect: (mon: DragSourceMonitor) => ({
      isDragging: mon.isDragging(),
    }),
  });

  const [{ canDrop: canInstantDrop, item }, drop] = useDrop<
    ItemDescription<T>,
    void,
    {
      canDrop: boolean;
      item: ItemDescription<T> | null;
    }
  >({
    accept: parentProps?.acceptType || type,
    canDrop: () => !parentProps?.noDrop,
    hover: (_item, mon) => {
      const rect = container.current?.getBoundingClientRect();
      const posY = mon.getClientOffset()?.y;
      const itemType = mon.getItem()?.type;

      setShowUpperDropZone(
        ((itemType != null &&
          (typeof acceptType === 'string' || typeof acceptType === 'symbol') &&
          acceptType === itemType) ||
          (Array.isArray(acceptType) &&
            acceptType.includes(itemType) &&
            mon.isOver({ shallow: true }) &&
            rect != null &&
            posY != null &&
            posY < rect.top + rect.height / 2)) === true,
      );
    },
    collect: (mon: DropTargetMonitor) => {
      draggingMonitor && draggingMonitor.isDragging(mon.isOver());
      return {
        isOverCurrent: mon.isOver({ shallow: true }),
        canDrop: mon.canDrop(),
        item: mon.getItem(),
      };
    },
  });

  const canDrop = useDebounce(canInstantDrop, 100);

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

  const [{ isOverCurrent: isOverDown }, dropDown] = useTreeViewDrop<T>(
    acceptType ? acceptType : type,
    noDrop,
    res => {
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

  const getParentProps: () => ReturnType<GetParentPropsFn<T>> = () => ({
    index: nbChild++,
    type,
    onDrop,
    parentProps: {
      id,
      acceptType,
      noDrop,
    },
  });

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
          <DropPreview
            ref={dropUp}
            className={dropZoneClass(isOverUp)}
            height={item?.source?.current?.getBoundingClientRect().height || 50}
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
                  minHeight: isOverDown
                    ? item?.source?.current?.getBoundingClientRect().height ||
                      50
                    : '5px',
                }}
                className={dropZoneClass(isOverDown)}
              >
                {!isDragging && isOverDown && (
                  <DropPreview
                    className={dropZoneClass(isOverDown)}
                    height={
                      item?.source?.current?.getBoundingClientRect().height ||
                      50
                    }
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
