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
import {
  useDrag,
  useDrop,
  DropTargetMonitor,
  DragSourceMonitor,
} from 'react-dnd';
import { classNameOrEmpty } from '../../../../Helper/className';
import { deepDifferent } from '../../../../Components/Hooks/storeHookFactory';
import { omit } from 'lodash-es';
import { Button } from '../../../../Components/Inputs/Buttons/Button';

const treeNodeStyle = cx(flex, flexColumn, css({ marginTop: '1px' }));
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
  container?: React.MutableRefObject<HTMLDivElement | undefined>;
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

interface TreeProps<T> extends Omit<ClassStyleId, 'id'> {
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
      {/* create an invisible root node to initiate the tree */}
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

interface DropPreviewProps<T>
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  /**
   * acceptType - the accepted types of dropped elements
   */
  acceptType: string | symbol | (string | symbol)[];
  /**
   * noDrop - conditions that disables drop
   */
  noDrop?: boolean;
  /**
   * onDrop - trigered when an element is dropped
   */
  onPreviewDrop?: (result: TreeViewDropResult<T>) => void;
  /**
   * height - the height of the preview zone
   */
  height?: React.CSSProperties['height'];
  /**
   * minHeight - the minimum height of the drop preview
   */
  minHeight?: React.CSSProperties['minHeight'];
  /**
   * onHover - trigger when the hover state changes
   */
  onHover?: (isOver: boolean) => void;
}

function DropPreview<T>({
  height,
  minHeight,
  className,
  style,
  acceptType,
  noDrop,
  onPreviewDrop,
  onHover: onDropZoneMonitor,
  ref,
  ...restProps
}: DropPreviewProps<T>) {
  const isOverRef = React.useRef<boolean>(false);
  const [isOverCurrent, drop] = useTreeViewDrop<T>(
    acceptType,
    noDrop,
    onPreviewDrop,
  );

  React.useEffect(() => {
    if (onDropZoneMonitor && isOverRef.current !== isOverCurrent) {
      isOverRef.current = isOverCurrent;
      onDropZoneMonitor(isOverCurrent);
    }
  }, [isOverCurrent, onDropZoneMonitor]);

  return (
    <div
      ref={drop}
      className={cx(dropZoneClass(isOverCurrent), className)}
      style={{
        ...style,
        height,
        minHeight,
      }}
      {...restProps}
    />
  );
}

function isOverAllowed(
  acceptType: string | symbol | (string | symbol)[] | undefined,
  itemType: string | symbol | undefined | null,
  isOver: boolean,
) {
  return (
    isOver &&
    itemType != null &&
    (((typeof acceptType === 'string' || typeof acceptType === 'symbol') &&
      acceptType === itemType) ||
      (Array.isArray(acceptType) && acceptType.includes(itemType)))
  );
}

type TreeViewDropResult<T> = Omit<DropResult<T>, 'target'>;

function useTreeViewDrop<T>(
  acceptType: Exclude<TreeNodeProps<T>['acceptType'], undefined>,
  noDrop: TreeNodeProps<T>['noDrop'],
  onDrop?: (result: TreeViewDropResult<T>) => void,
) {
  return useDrop<ItemDescription<T>, void, boolean>({
    accept: acceptType,
    canDrop: () => !noDrop,
    drop: ({ id, parent, index }, mon) => {
      onDrop &&
        onDrop({
          item: omit(mon.getItem(), 'container'),
          id,
          source: {
            parent,
            index,
          },
        });
    },
    collect: (mon: DropTargetMonitor) => {
      return isOverAllowed(
        acceptType,
        mon.getItemType(),
        mon.isOver({ shallow: true }),
      );
    },
  });
}

interface ParentPassedProps<T> {
  /**
   * id - the id of the parent node
   */
  id: ItemDescription<T>['parent'];
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

interface TreeNodeProps<T> extends Omit<ClassStyleId, 'id'> {
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
   * noTitle - hide the title and the caret and force expand the Node
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
  const innerContainer = React.useRef<HTMLDivElement>();
  const hoverValues = React.useRef<{
    posY?: number;
    itemType: string | symbol | null;
    isOver: boolean;
  }>({ itemType: null, isOver: false });
  const [{ isOverUp, isOverDown }, setHoverMonitors] = React.useState<{
    isOverUp: boolean;
    isOverDown: boolean;
  }>({ isOverUp: false, isOverDown: false });
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
      container: innerContainer,
    },
    canDrag: () => !noDrag,
    collect: (mon: DragSourceMonitor) => {
      return {
        isDragging: mon.isDragging(),
      };
    },
  });

  const onHoverInner = React.useCallback(
    (_item: ItemDescription<T>, mon: DropTargetMonitor) => {
      const posY = mon.getClientOffset()?.y;
      const itemType = mon.getItemType();
      const isOver = mon.isOver({ shallow: true });

      if (deepDifferent(hoverValues.current, { posY, itemType, isOver })) {
        hoverValues.current = { posY, itemType, isOver };
        const rect = innerContainer.current?.getBoundingClientRect();
        setHoverTopNode(
          isOverAllowed(parentProps?.acceptType || type, itemType, isOver) &&
            rect != null &&
            posY != null &&
            posY < rect.top + (rect.height * 1) / 4 === true,
        );
        setHoverBottomNode(
          isOverAllowed(parentProps?.acceptType || type, itemType, isOver) &&
            rect != null &&
            posY != null &&
            posY > rect.top + (rect.height * 3) / 4 === true,
        );
      }
    },
    [parentProps, type],
  );

  const onDropInner = React.useCallback(
    (
      { id: itemId, parent, index }: ItemDescription<T>,
      mon: DropTargetMonitor,
    ) => {
      if (onDrop && mon.isOver({ shallow: true })) {
        onDrop({
          item: omit(mon.getItem(), 'container'),
          id: itemId,
          source: {
            parent,
            index,
          },
          target: {
            parent: id,
            index: nbChild,
          },
        });
      }
    },
    [onDrop, id, nbChild],
  );

  const [{ item, isOverCurrent: isOverMain }, drop] = useDrop<
    ItemDescription<T>,
    void,
    {
      isOverCurrent: boolean;
      item: ItemDescription<T> | null;
    }
  >({
    accept: acceptType || type,
    canDrop: () => !noDrop,
    drop: onDropInner,
    hover: onHoverInner,
    collect: (mon: DropTargetMonitor) => {
      return {
        isOverCurrent: mon.isOver({ shallow: true }),
        item: mon.getItem(),
      };
    },
  });

  const onDropUp = React.useCallback(
    (res: Pick<DropResult<T>, 'id' | 'item' | 'source'>) => {
      onDrop &&
        onDrop({
          ...res,
          target: {
            parent: parentProps?.id,
            index,
          },
        });
    },
    [onDrop, index, parentProps],
  );

  const onDropDown = React.useCallback(
    (res: Pick<DropResult<T>, 'id' | 'item' | 'source'>) => {
      onDrop &&
        onDrop({
          ...res,
          target: {
            parent: parentProps?.id,
            index: index == null ? undefined : index + 1,
          },
        });
    },
    [onDrop, index, parentProps],
  );

  React.useEffect(() => {
    setExpanded(isExpanded || noTitle);
  }, [isExpanded, noTitle]);

  const showTopDropZone =
    !parentProps?.noDrop &&
    !isDragging &&
    ((isOverMain && hoverTopNode) || isOverUp) &&
    deepDifferent(item?.id, parentProps?.id);
  const showBottomDropZone =
    !parentProps?.noDrop &&
    !isDragging &&
    ((isOverMain && hoverBottomNode) || isOverDown) &&
    deepDifferent(item?.id, parentProps?.id) &&
    parentProps?.getLastChildrenIndex() === index;
  const showInnerDropZone =
    children != null &&
    !expanded &&
    !noDrop &&
    !isDragging &&
    isOverMain &&
    deepDifferent(item?.id, id);

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

  return (
    <div className={treeNodeStyle + classNameOrEmpty(className)} style={style}>
      {showTopDropZone && (
        <DropPreview
          acceptType={parentProps?.acceptType || type}
          noDrop={parentProps?.noDrop}
          onPreviewDrop={onDropUp}
          height={
            item?.container?.current?.getBoundingClientRect().height || 20
          }
          onHover={isOverUp => setHoverMonitors(ohm => ({ ...ohm, isOverUp }))}
        />
      )}
      <div
        ref={ref => {
          if (ref) {
            innerContainer.current = ref;
            drag(ref);
            drop(ref);
          }
        }}
        className={showInnerDropZone ? dropZoneClass(isOverMain) : undefined}
      >
        {!noTitle && (
          <div ref={preview} className={cx(flex, relative, itemCenter)}>
            {children != null && (
              <div>
                <Button
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
      {showBottomDropZone && (
        <DropPreview
          acceptType={parentProps?.acceptType || type}
          noDrop={parentProps?.noDrop}
          onPreviewDrop={onDropDown}
          height={
            item?.container?.current?.getBoundingClientRect().height || 20
          }
          onHover={isOverDown =>
            setHoverMonitors(ohm => ({ ...ohm, isOverDown }))
          }
        />
      )}
    </div>
  );
}
