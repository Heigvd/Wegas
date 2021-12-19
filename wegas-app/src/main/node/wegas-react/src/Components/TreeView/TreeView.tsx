import * as React from 'react';
import { TreeChildren } from './TreeChildren';
import {
  nodeStyle,
  emptyNodeStyle,
  dragUpStyle,
  dragDownStyle,
  dragOverStyle,
  dragMarginStyle,
} from './classes';
import { wwarn } from '../../Helper/wegaslog';

export const DEFAULT_TREENODE_TYPE = 'DEFAULT_TREENODE_TYPE';
export const DEFAULT_FILE_TYPE = 'Files';
export const TREEVIEW_DEFAULT_TYPES = ['path', 'id', 'data'];

export function allowDrag(
  notDroppable: boolean,
  acceptTypes: readonly string[] | null,
  types: readonly string[],
) {
  return (
    !notDroppable &&
    acceptTypes != null &&
    acceptTypes.some(type =>
      types.map(type => type.toLowerCase()).includes(type.toLowerCase()),
    )
  );
}

const MARGIN_SIZE = 20;
function DefaultCarret({ icon }: { icon: string }) {
  return (
    <div
      style={{
        display: 'flex',
        width: MARGIN_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {icon}
    </div>
  );
}
const MINIMUM_NODE_LABEL_HEIGHT = 30;
const MINIMUM_NODE_LABEL_WIDTH = 100;
const KEEP_OPEN_ON_DRAG = false;
const OPEN_CLOSE_BUTTONS = {
  open: <DefaultCarret icon="▾" />,
  close: <DefaultCarret icon="▸" />,
};
const LEVEL_ICON = "└";
const DESIGN_PARAMS: DesignParams = {
  nodeStyle,
  emptyNodeStyle,
  dragUpStyle,
  dragDownStyle,
  dragOverStyle,
  dragMarginStyle,
};

interface DesignParams {
  nodeStyle: string;
  emptyNodeStyle: string;
  dragUpStyle: string;
  dragDownStyle: string;
  dragOverStyle: string;
  dragMarginStyle: string;
}

interface TreeViewContextParameters {
  minimumNodeHeight: number;
  minimumLabelWidth: number;
  keepOpenOnDrag: boolean;
  openCloseButtons: {
    open: React.ReactNode;
    close: React.ReactNode;
  };
  levelIcon: string;
  designParams: DesignParams;
  openOnDrag: null | number;
}

export type OnMoveFn<T = unknown> = (
  from: {
    path?: number[];
    id?: string;
    data?: T | null;
    dataTransfer: unknown;
  },
  to: { path: number[]; id: string; data?: T | null },
) => void;

type TreeContextParameters = Partial<TreeViewContextParameters>;

interface DragState {
  id: string;
  position: 'UP' | 'DOWN' | 'IN' | 'IN_LAST' | 'IN_EMPTY' | undefined;
}

export const POSITION_DATA = {
  openCloseButton: 'TREENODE_OPEN_CLOSE_BUTTON',
  label: 'TREENODE_LABEL',
  margin: 'TREENODE_MARGIN',
  content: 'TREENODE_CONTENT',
};

interface TreeViewContext extends TreeViewContextParameters {
  dragState: DragState;
  openNodes: { [path: string]: boolean | undefined };
  toggleNode: (id: string) => void;
  endDrag: () => void;
}

export const treeviewCTX = React.createContext<TreeViewContext>({
  dragState: { id: '0', position: undefined },
  minimumNodeHeight: MINIMUM_NODE_LABEL_HEIGHT,
  minimumLabelWidth: MINIMUM_NODE_LABEL_WIDTH,
  keepOpenOnDrag: KEEP_OPEN_ON_DRAG,
  openCloseButtons: OPEN_CLOSE_BUTTONS,
  levelIcon: LEVEL_ICON,
  designParams: DESIGN_PARAMS,
  openOnDrag: null,
  openNodes: {},
  toggleNode: () => {},
  endDrag: () => {},
});

interface TreeViewProps<T = unknown> extends ClassStyleId {
  rootId: string;
  rootData?: T | null;
  rootPath?: number[];
  notDroppable?: boolean;
  acceptTypes?: string[];
  nodeManagement?: {
    openNodes: { [path: string]: boolean | undefined };
    setOpenNodes: React.Dispatch<
      React.SetStateAction<{ [path: string]: boolean | undefined }>
    >;
  };
  onMove?: OnMoveFn<T>;
  parameters?: TreeContextParameters & { designParams: Partial<DesignParams> };
  style?: React.CSSProperties;
  className?: string;
}

export function TreeView<T = unknown>({
  rootId,
  rootData = null,
  rootPath = [],
  notDroppable,
  acceptTypes = [DEFAULT_TREENODE_TYPE],
  nodeManagement,
  parameters,
  onMove,
  children,
  className,
  style,
}: React.PropsWithChildren<TreeViewProps<T>>) {
  const oppeningTimer = React.useRef<NodeJS.Timer | null>(null);

  const {
    minimumNodeHeight = MINIMUM_NODE_LABEL_HEIGHT,
    minimumLabelWidth = MINIMUM_NODE_LABEL_WIDTH,
    keepOpenOnDrag = KEEP_OPEN_ON_DRAG,
    openCloseButtons = OPEN_CLOSE_BUTTONS,
    levelIcon = LEVEL_ICON,
    designParams = {},
    openOnDrag = null,
  } = parameters || {};

  const [dragState, setDragState] = React.useState<DragState>({
    id: rootId,
    position: undefined,
  });

  const { id, position } = dragState;

  const [openNodesState, setOpenNodesState] = React.useState<{
    [path: string]: boolean | undefined;
  }>(nodeManagement?.openNodes || {});

  const openNodes = nodeManagement?.openNodes || openNodesState;
  const setOpenNodes = nodeManagement?.setOpenNodes || setOpenNodesState;

  const toggleNode = React.useCallback(
    function (id: string) {
      setOpenNodes(o => ({ ...o, [id]: !o[id] }));
    },
    [setOpenNodes],
  );

  const openNode = React.useCallback(
    function (id: string) {
      setOpenNodes(o => ({ ...o, [id]: true }));
    },
    [setOpenNodes],
  );

  function endDrag() {
    setDragState(ods => ({ ...ods, position: undefined }));
  }

  React.useEffect(() => {
    if (oppeningTimer.current != null) {
      clearTimeout(oppeningTimer.current);
    }
    oppeningTimer.current = setTimeout(() => {
      if (position === 'IN') {
        openNode(id);
      }
    }, 500);
  }, [position, id, openNodes, openNode]);

  React.useEffect(() => {
    return function () {
      if (oppeningTimer.current != null) {
        clearTimeout(oppeningTimer.current);
      }
    };
  }, []);

  const dropZoneSplittingSize = minimumNodeHeight / 3;

  const onDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // preventDefault is the magic to make onDrop work
      e.preventDefault();
      // stopPropagation is there to avoid onDragOver be captured by parents
      e.stopPropagation();

      let target = e.target as HTMLElement;
      let idData;
      let positionData;
      let showDownData;
      let hasChildrenData;
      let notDroppable;
      let acceptTypes;
      let parentNotDroppable;
      let parentAcceptTypes;

      do {
        idData = target.getAttribute('data-treenode-id');
        positionData = target.getAttribute('data-treenode-position');
        showDownData = target.getAttribute('data-treenode-show-down');
        hasChildrenData = target.getAttribute('data-treenode-has-children');
        notDroppable = target.getAttribute('data-treenode-not-droppable');
        acceptTypes = target.getAttribute('data-treenode-accept-types');
        parentNotDroppable = target.getAttribute(
          'data-treenode-parent-not-droppable',
        );
        parentAcceptTypes = target.getAttribute(
          'data-treenode-parent-accept-types',
        );
        target = target.parentElement as HTMLElement;
      } while (target != null && idData == null && positionData == null);

      acceptTypes = JSON.parse(acceptTypes as string) as null | string[];
      parentAcceptTypes = JSON.parse(parentAcceptTypes as string) as
        | null
        | string[];
      const types = e.dataTransfer.types;
      notDroppable = notDroppable === 'true';
      parentNotDroppable = parentNotDroppable === 'true';

      const childrenAllowDrag = allowDrag(notDroppable, acceptTypes, types);
      const parrentAllowDrag = allowDrag(
        parentNotDroppable,
        parentAcceptTypes,
        types,
      );

      if (idData != null && positionData != null) {
        let position: DragState['position'] = undefined;

        switch (positionData) {
          case POSITION_DATA.openCloseButton:
            if (childrenAllowDrag) {
              position = 'IN';
            }
            break;
          case POSITION_DATA.label: {
            const { top, height } = target.getBoundingClientRect();
            const relativeY = e.clientY - top;
            showDownData = showDownData === 'true';
            hasChildrenData = hasChildrenData === 'true';

            if (relativeY < dropZoneSplittingSize) {
              if (parrentAllowDrag) {
                position = 'UP';
              }
            } else if (
              showDownData &&
              height - relativeY < dropZoneSplittingSize
            ) {
              if (parrentAllowDrag) {
                position = 'DOWN';
              }
            } else if (hasChildrenData) {
              if (childrenAllowDrag) {
                position = 'IN';
              }
            }
            break;
          }
          case POSITION_DATA.margin:
            if (childrenAllowDrag) {
              position = 'IN_LAST';
            }
            break;
          case POSITION_DATA.content:
            if (childrenAllowDrag) {
              position = 'IN_EMPTY';
            }
            break;
        }

        setDragState({
          id: idData,
          position,
        });
      } else {
        setDragState({
          id: '',
          position: undefined,
        });
      }
    },
    [dropZoneSplittingSize],
  );

  const onDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // stopPropagation avoids interference with react-dnd library
      e.stopPropagation();
      if (onMove) {
        let target = e.target as HTMLElement;
        let data;
        let id;
        let path;
        do {
          if (
            position === 'IN' ||
            position === 'IN_EMPTY' ||
            position === 'IN_LAST'
          ) {
            data = target.getAttribute('data-treenode-data');
            id = target.getAttribute('data-treenode-id');
          } else {
            data = target.getAttribute('data-treenode-parent-data');
            id = target.getAttribute('data-treenode-parent-id');
          }
          path = target.getAttribute('data-treenode-path');
          target = target.parentElement as HTMLElement;
        } while (target != null && id == null && path == null);

        if (id != null && path != null) {
          if (data != null) {
            data = JSON.parse(data);
          }
          path = JSON.parse(path) as number[];
          if (position === 'UP' || position === 'DOWN') {
            // Pop first element (index of the child)
            path.pop();
            let index = path.pop();
            if (index != null) {
              if (position === 'DOWN') {
                index += 1;
              }
              path = [...path, index];
            }
          }

          let fromPath;
          let fromId;
          let fromData;

          try {
            fromPath = JSON.parse(e.dataTransfer.getData('path'));
          } catch (_e) {
            fromPath = undefined;
          }
          try {
            fromId = e.dataTransfer.getData('id');
          } catch (_e) {
            fromId = undefined;
          }
          try {
            fromData = JSON.parse(e.dataTransfer.getData('data'));
          } catch (_e) {
            fromData = undefined;
          }

          onMove(
            {
              path: fromPath,
              id: fromId,
              data: fromData,
              dataTransfer: e.dataTransfer,
            },
            { path, id, data },
          );
          if (id !== rootId) {
            openNode(id);
          }
        } else {
          wwarn('No given id');
        }
      }

      setDragState({
        id: '',
        position: undefined,
      });
    },
    [onMove, openNode, position, rootId],
  );

  return (
    <div
      style={{
        ...style,
        flex: '1 1 auto',
      }}
      id={rootId}
      data-treenode-path={JSON.stringify([
        ...rootPath,
        React.Children.count(children),
      ])}
      data-treenode-id={rootId}
      data-treenode-position={POSITION_DATA.margin}
      data-treenode-data={JSON.stringify(rootData)}
      data-treenode-not-droppable={notDroppable}
      onDragOver={onDragOver}
      onDragLeave={() => {
        setDragState({
          id: '',
          position: undefined,
        });
      }}
      onDrop={onDrop}
    >
      <treeviewCTX.Provider
        value={{
          dragState,
          minimumNodeHeight: minimumNodeHeight,
          minimumLabelWidth: minimumLabelWidth,
          keepOpenOnDrag,
          openCloseButtons,
          levelIcon,
          designParams: { ...DESIGN_PARAMS, ...designParams },
          openOnDrag,
          openNodes,
          toggleNode,
          endDrag,
        }}
      >
        <TreeChildren
          id={rootId}
          data={rootData}
          path={rootPath}
          notDroppable={notDroppable}
          acceptTypes={acceptTypes}
          className={className}
        >
          {children}
        </TreeChildren>
      </treeviewCTX.Provider>
    </div>
  );
}
