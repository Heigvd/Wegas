import { cx } from 'emotion';
import * as React from 'react';
import { treeviewCTX } from './TreeView';

export interface PassePropsContext {
  parentData?: unknown;
  parentId: string | number;
  path: number[];
  last: boolean;
  notDroppable?: boolean;
  parentAcceptTypes: string[];
}

export const passedPropsCTX = React.createContext<PassePropsContext>({
  parentId: 0,
  path: [],
  last: false,
  parentAcceptTypes: [],
});

export type DragOverType = 'UP' | 'IN' | 'DOWN' | 'EMPTY' | undefined;

interface TreeChildrenProps<T = unknown> {
  id: string;
  data: T | null;
  path: number[];
  notDroppable?: boolean;
  acceptTypes: string[];
}

export function TreeChildren<T = unknown>({
  id,
  data = null,
  path,
  notDroppable,
  children,
  acceptTypes,
}: React.PropsWithChildren<TreeChildrenProps<T>>) {
  const { minimumNodeHeight, minimumLabelWidth, designParams, dragState } =
    React.useContext(treeviewCTX);

  const { emptyNodeStyle, dragDownStyle } = designParams;

  const childrenLength = React.Children.count(children);

  const isEmpty = children != null && childrenLength === 0;

  const dragMargin =
    dragState.id === id && dragState.position === 'IN_LAST' && !isEmpty;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
      className={cx({
        [dragDownStyle]: dragMargin,
      })}
    >
      {children != null && childrenLength === 0 ? (
        <div
          style={{ minHeight: minimumNodeHeight, minWidth: minimumLabelWidth }}
          className={emptyNodeStyle}
        >
          Empty...
        </div>
      ) : (
        React.Children.map(children, (child, index) => (
          <passedPropsCTX.Provider
            value={{
              parentData: data,
              parentId: id,
              path: [...path, index],
              last: index === childrenLength - 1,
              notDroppable,
              parentAcceptTypes: acceptTypes,
            }}
          >
            {child}
          </passedPropsCTX.Provider>
        ))
      )}
    </div>
  );
}
