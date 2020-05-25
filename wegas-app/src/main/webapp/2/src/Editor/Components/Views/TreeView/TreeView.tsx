import * as React from 'react';
import {
  DefaultDndProvider,
  dropZoneClass,
} from '../../../../Components/Contexts/DefaultDndProvider';
import {
  flexColumn,
  flex,
  relative,
  itemCenter,
} from '../../../../css/classes';
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
  // source?: React.MutableRefObject<HTMLDivElement | undefined>;
  rect: DOMRect | undefined;
}

export function isItemDescription<T>(
  item?: Partial<ItemDescription<T>>,
): item is ItemDescription<T> {
  return (
    typeof item === 'object' &&
    'id' in item &&
    'type' in item &&
    (typeof item.type === 'string' || typeof item.type === 'symbol')
  );
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
  /**
   * hide - hide the drop zone
   */
  hide?: boolean;
}

const DropPreview = React.forwardRef<HTMLDivElement, DropPreviewProps>(
  ({ height, minHeight, className, style, hide }: DropPreviewProps, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          ...style,
          height,
          minHeight,
          ...(hide ? { display: 'none' } : {}),
        }}
      />
    );
  },
);

function isOverAllowed(
  acceptType: string | symbol | (string | symbol)[] | undefined,
  itemType: string | symbol | undefined | null,
  isOver: boolean,
) {
  // wlog({ acceptType, itemType, isOver });
  return (
    isOver &&
    itemType != null &&
    (((typeof acceptType === 'string' || typeof acceptType === 'symbol') &&
      acceptType === itemType) ||
      (Array.isArray(acceptType) && acceptType.includes(itemType)))
  );
}

function useTreeViewDrop<T>(
  acceptType: Exclude<TreeNodeProps<T>['acceptType'], undefined>,
  noDrop: TreeNodeProps<T>['noDrop'],
  onDrop?: (result: Omit<DropResult<T>, 'target'>) => void,
) {
  return useDrop<
    ItemDescription<T>,
    void,
    {
      isOver: boolean;
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
      const itemType = mon.getItemType();
      return {
        isOver: isOverAllowed(acceptType, itemType, mon.isOver()),
        isOverCurrent: isOverAllowed(
          acceptType,
          itemType,
          mon.isOver({ shallow: true }),
        ),
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
  // /**
  //  * nbChild - the number of children in the parent
  //  */
  // nbChild: React.MutableRefObject<number>;
  /**
   * getLastChildrenIndex - return the index of the last children
   */
  getLastChildrenIndex: () => number;
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
  // /**
  //  * draggingMonitor - object that allows monitoring the dragged element over the tree
  //  */
  // draggingMonitor?: {
  //   /**
  //    * isDragging - called every time a element with monitorTypes is dragged
  //    */
  //   isDragging: (dragging: boolean) => void;
  //   /**
  //    * monitorTypes - the types of element to monitor
  //    */
  //   monitorTypes: (string | symbol)[];
  // };
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
  // draggingMonitor,
  children,
  className,
  style,
}: TreeNodeProps<T>) {
  const innerContainer = React.useRef<HTMLDivElement>();
  const [expanded, setExpanded] = React.useState(isExpanded || noTitle);
  const [hoverTopNode, setHoverTopNode] = React.useState(false);
  const [hoverBottomNode, setHoverBottomNode] = React.useState(false);

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
      rect: innerContainer.current?.getBoundingClientRect(),
    },
    canDrag: () => !noDrag,
    collect: (mon: DragSourceMonitor) => {
      return {
        isDragging: mon.isDragging(),
      };
    },
  });

  const [{ item, isOverCurrent: isOverCurrentNode }, drop] = useDrop<
    ItemDescription<T>,
    void,
    {
      isOverCurrent: boolean;
      item: ItemDescription<T> | null;
    }
  >({
    accept: parentProps?.acceptType || type,
    canDrop: () => !parentProps?.noDrop,
    drop: ({ id, parent, index }, mon) => {
      onDrop &&
        onDrop({
          item: mon.getItem(),
          id,
          source: {
            parent,
            index,
          },
          target: {
            parent: id,
            index: nbChild,
          },
        });
    },
    hover: (_item, mon) => {
      const rect = innerContainer.current?.getBoundingClientRect();
      const posY = mon.getClientOffset()?.y;
      const itemType = mon.getItemType();

      setHoverTopNode(
        isOverAllowed(
          parentProps?.acceptType || type,
          itemType,
          mon.isOver({ shallow: true }),
        ) &&
          rect != null &&
          posY != null &&
          posY < rect.top + (rect.height * 1) / 4 === true,
      );
      setHoverBottomNode(
        isOverAllowed(
          parentProps?.acceptType || type,
          itemType,
          mon.isOver({ shallow: true }),
        ) &&
          rect != null &&
          posY != null &&
          posY > rect.top + (rect.height * 3) / 4 === true,
      );
    },
    collect: (mon: DropTargetMonitor) => {
      // draggingMonitor && draggingMonitor.isDragging(mon.isOver());
      return {
        isOverCurrent: mon.isOver({ shallow: true }),
        item: mon.getItem(),
      };
    },
  });

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
    parentProps?.acceptType || type,
    parentProps?.noDrop,
    res =>
      onDrop &&
      onDrop({
        ...res,
        target: {
          parent: parentProps?.id,
          index: index == null ? undefined : index + 1,
        },
      }),
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
      getLastChildrenIndex: () => nbChild - 1,
    },
  });

  const showTopDropZone =
    !parentProps?.noDrop &&
    !isDragging &&
    ((isOverCurrentNode && hoverTopNode) || isOverUp) &&
    deepDifferent(item?.id, parentProps?.id);
  const showBottomDropZone =
    !parentProps?.noDrop &&
    !isDragging &&
    ((isOverCurrentNode && hoverBottomNode) || isOverDown) &&
    deepDifferent(item?.id, parentProps?.id) &&
    parentProps?.getLastChildrenIndex() === index;
  const showInnerDropZone =
    children != null &&
    !expanded &&
    !noDrop &&
    !isDragging &&
    isOverCurrentNode &&
    deepDifferent(item?.id, id);

  return (
    <div className={treeNodeStyle + classNameOrEmpty(className)} style={style}>
      <DropPreview
        ref={dropUp}
        className={dropZoneClass(isOverUp)}
        height={item?.rect?.height || 20}
        hide={!showTopDropZone}
      />
      <div
        ref={ref => {
          if (ref) {
            innerContainer.current = ref;
            drag(ref);
            drop(ref);
          }
        }}
        className={showInnerDropZone ? dropZoneClass(true) : undefined}
      >
        {!noTitle && (
          <div ref={preview} className={cx(flex, relative, itemCenter)}>
            {children != null && (
              <div>
                <IconButton
                  icon={expanded ? 'caret-down' : 'caret-right'}
                  onClick={() => setExpanded(e => !e)}
                />
              </div>
            )}
            {title != null && <div>{title}</div>}
          </div>
        )}
        {children != null && expanded && (
          <div className={noTitle ? undefined : childrenStyle}>
            {typeof children === 'function'
              ? children(getParentProps)
              : children}
          </div>
        )}
      </div>
      <DropPreview
        ref={dropDown}
        className={dropZoneClass(isOverDown)}
        height={item?.rect?.height || 20}
        hide={!showBottomDropZone}
      />
    </div>
  );
}
