import { cx } from '@emotion/css';
import * as React from 'react';
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
  label: React.ReactNode | ((open: boolean) => React.ReactNode);
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
    minimumLabelWidth,
    keepOpenOnDrag,
    openCloseButtons,
    levelIcon,
    designParams,
    openNodes,
    toggleNode,
    endDrag,
    dragState,
  } = React.useContext(treeviewCTX);

  const {
    nodeStyle,
    dragUpStyle,
    dragDownStyle,
    dragOverStyle,
    dragMarginStyle,
  } = designParams;

  const {
    parentData = null,
    parentAcceptTypes,
    parentId,
    path = [],
    last,
    notDroppable: parentNotDroppable,
  } = React.useContext(passedPropsCTX);

  const open = openNodes[id];
  const joinOpen = forceOpenClose != null ? forceOpenClose : open;

  const dragOverNode = dragState.id === id;
  const dragUp = dragOverNode && dragState.position === 'UP';
  const dragDown = dragOverNode && dragState.position === 'DOWN';
  const dragIn =
    dragOverNode &&
    (dragState.position === 'IN' || dragState.position === 'IN_EMPTY');
  const dragMargin = dragOverNode && dragState.position === 'IN_LAST';

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
      onDoubleClick={e => {
        toggleNode(id);
        e.stopPropagation();
      }}
      style={{
        ...{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)' },
        ...style,
      }}
      className={className}
      id={id}
    >
      {children != null ? (
        <div
          style={{
            ...{
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '1.8rem',
              width: '1rem',
              opacity: 0.5,
              margin: '0 3px 0 6px',
            },
            ...(forceOpenClose != null && forceOpenClose !== open
              ? { opacity: 0.5 }
              : {}),
          }}
          className={cx({
            [dragUpStyle]: dragUp,
            [dragDownStyle]: dragDown,
            [dragMarginStyle]: dragMargin,
          })}
          onClick={() => toggleNode(id)}
          data-treenode-path={JSON.stringify([...path, 0])}
          data-treenode-id={id}
          data-treenode-position={POSITION_DATA.openCloseButton}
          data-treenode-data={JSON.stringify(data)}
          data-treenode-not-droppable={notDroppable}
          data-treenode-accept-types={JSON.stringify(acceptTypes)}
        >
          {open ? openCloseButtons.open : openCloseButtons.close}
        </div>
      ) : (
        <div
          style={{
            ...{
              display: 'flex',
              height: '1.8rem',
              width: '1rem',
              alignItems: 'center',
              opacity: 0.1,
              color: 'black',
              margin: '0 3px',
            },
          }}
        >
          {levelIcon}
        </div>
      )}
      <div
        draggable={!notDraggable}
        style={{
          minWidth: minimumLabelWidth,
          gridColumn: 'initial',
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
        {typeof label === 'function' ? label(!!open) : label}
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
