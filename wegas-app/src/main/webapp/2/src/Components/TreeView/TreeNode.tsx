import * as React from 'react';
import { cx } from 'emotion';
import { passedPropsCTX, TreeChildren } from './TreeChildren';
import {
  DEFAULT_FILE_TYPE,
  DEFAULT_TREENODE_TYPE,
  POSITION_DATA,
  treeviewCTX,
  TREEVIEW_DEFAULT_TYPES,
} from './TreeView';

let globalComputedId = 0;

export interface TreeNodePassedProps<T = unknown> {
  parentData?: T | null;
  parentId: string;
  path: number[];
}

interface TreeNodeProps<T = unknown> extends ClassStyleId {
  // id: string;
  data?: T | null;
  label: React.ReactNode;
  type?: string;
  acceptTypes?: string[];
  forceOpenClose?: boolean;
  notDraggable?: boolean;
  notDroppable?: boolean;
}

export function TreeNode<T = unknown>({
  data = null,
  label,
  type = DEFAULT_TREENODE_TYPE,
  acceptTypes = [DEFAULT_TREENODE_TYPE],
  forceOpenClose,
  notDraggable,
  notDroppable,
  children,
  style,
  className,
  id: initId,
}: React.PropsWithChildren<TreeNodeProps<T>>) {
  const { current: id } = React.useRef(
    initId == null ? String(globalComputedId++) : initId,
  );

  if (type.toLowerCase() === DEFAULT_FILE_TYPE.toLowerCase()) {
    throw Error(
      `Do not use ${type} for TreeNode acceptType. This is reserved only for files!`,
    );
  } else if (
    TREEVIEW_DEFAULT_TYPES.find(t => t.toLowerCase() === type.toLowerCase())
  ) {
    throw Error(
      `Do not use ${type} for TreeNode acceptType. This is reserved for internal TreeNode management`,
    );
  }

  const [dragging, setDragging] = React.useState(false);

  const {
    minimumNodeHeight,
    minimumLabelWidth,
    keepOpenOnDrag,
    openCloseButtons,
    designParams,
    openNodes,
    toggleNode,
    endDrag,
    dragState,
  } = React.useContext(treeviewCTX);

  const { nodeStyle, dragUpStyle, dragDownStyle, dragOverStyle } = designParams;

  const {
    parentData = null,
    parentAcceptTypes,
    parentId,
    path = [],
    last,
    notDroppable: parentNotDroppable,
  } = React.useContext(passedPropsCTX);

  // const [{ isDragging }, drag] = useDrag<any, void, { isDragging: boolean }>({
  //   item: {
  //     id,
  //     type: acceptType,
  //     path,
  //     data,
  //   },
  //   canDrag: () => !notDraggable,
  //   collect: (mon: DragSourceMonitor) => {
  //     return {
  //       isDragging: mon.isDragging(),
  //     };
  //   },
  // });

  const open = openNodes[id];
  const joinOpen = forceOpenClose != null ? forceOpenClose : open;

  const dragOverNode = dragState.id === id;
  const dragUp = dragOverNode && dragState.position === 'UP';
  const dragDown = dragOverNode && dragState.position === 'DOWN';
  const dragIn =
    dragOverNode &&
    (dragState.position === 'IN' ||
      dragState.position === 'IN_LAST' ||
      dragState.position === 'IN_EMPTY');

  return (
    <div
      onDragStart={e => {
        e.stopPropagation();
        e.dataTransfer.setData('path', JSON.stringify(path));
        e.dataTransfer.setData('id', id);
        e.dataTransfer.setData('data', JSON.stringify(data));
        e.dataTransfer.setData(type, '');
        setDragging(true);
      }}
      onDragEnd={e => {
        e.stopPropagation();
        endDrag();
        setDragging(false);
      }}
      style={{
        ...{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)' },
        ...style,
      }}
      className={className}
      id={id}
    >
      {children != null && (
        <div
          style={{
            ...{
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: minimumNodeHeight,
            },
            ...(forceOpenClose != null && forceOpenClose !== open
              ? { opacity: 0.5 }
              : {}),
          }}
          className={cx({
            [dragUpStyle]: dragUp,
            [dragDownStyle]: dragDown,
          })}
          onClick={() => toggleNode(id)}
          data-treenode-path={JSON.stringify([...path, 0])}
          data-treenode-id={id}
          data-treenode-position={POSITION_DATA.openCloseButton}
          data-treenode-data={JSON.stringify(data)}
          data-treenode-not-droppable={notDroppable}
          data-treenode-accept-types={JSON.stringify(acceptTypes)}
          // data-treenode-parent-id={parentId}
          // data-treenode-parent-data={JSON.stringify(parentData)}
          // data-treenode-parent-not-droppable={parentNotDroppable}
        >
          {open ? openCloseButtons.open : openCloseButtons.close}
        </div>
      )}
      <div
        // ref={drag}
        draggable={!notDraggable}
        style={{
          minWidth: minimumLabelWidth,
          gridColumn: children == null ? 'span 2' : 'initial',
        }}
        className={cx(nodeStyle, {
          [dragOverStyle]: dragIn,
          [dragUpStyle]: dragUp,
          [dragDownStyle]: dragDown,
        })}
        data-treenode-path={JSON.stringify([...path, 0])}
        data-treenode-id={id}
        data-treenode-position={POSITION_DATA.label}
        data-treenode-data={JSON.stringify(data)}
        data-treenode-has-children={children != null}
        data-treenode-show-down={!joinOpen && last}
        data-treenode-not-droppable={notDroppable}
        data-treenode-accept-types={JSON.stringify(acceptTypes)}
        data-treenode-parent-id={parentId}
        data-treenode-parent-data={JSON.stringify(parentData)}
        data-treenode-parent-not-droppable={parentNotDroppable}
        data-treenode-parent-accept-types={JSON.stringify(parentAcceptTypes)}
      >
        {label}
      </div>
      {children != null && (!dragging || keepOpenOnDrag) && joinOpen && (
        <>
          <div
            data-treenode-path={JSON.stringify([
              ...path,
              React.Children.count(children),
            ])}
            data-treenode-id={id}
            data-treenode-position={POSITION_DATA.margin}
            data-treenode-data={JSON.stringify(data)}
            data-treenode-not-droppable={notDroppable}
            data-treenode-accept-types={JSON.stringify(acceptTypes)}
            data-treenode-parent-id={parentId}
            data-treenode-parent-data={JSON.stringify(parentData)}
            data-treenode-parent-not-droppable={parentNotDroppable}
          />
          <div
            data-treenode-path={JSON.stringify([...path, 0])}
            data-treenode-id={id}
            data-treenode-position={POSITION_DATA.content}
            data-treenode-data={JSON.stringify(data)}
            data-treenode-not-droppable={notDroppable}
            data-treenode-accept-types={JSON.stringify(acceptTypes)}
            data-treenode-parent-id={parentId}
            data-treenode-parent-data={JSON.stringify(parentData)}
            data-treenode-parent-not-droppable={parentNotDroppable}
          >
            {(!dragging || keepOpenOnDrag) && joinOpen && (
              <TreeChildren
                id={id}
                path={path}
                data={data}
                notDroppable={notDroppable}
                acceptTypes={acceptTypes}
              >
                {children}
              </TreeChildren>
            )}
          </div>
        </>
      )}
    </div>
  );
}
