import { css, cx } from '@emotion/css';
import * as React from 'react';
import { wlog } from '../../Helper/wegaslog';
import { TreeNode } from './TreeNode';
import { TreeNodeStructure } from './types';

export function structureToJSX(node: TreeNodeStructure) {
  return (
    <TreeNode key={node.id} id={node.id} label={node.label} data={node}>
      {node.items && node.items.map(item => structureToJSX(item))}
    </TreeNode>
  );
}

export function structureTextToJSX(node: TreeNodeStructure) {
  return (
    <TreeNode key={node.id} id={node.id} label={node.label} data={node}>
      {node.items && node.items.map(item => structureToJSX(item))}
    </TreeNode>
  );
}

export function getNode(structure: TreeNodeStructure, path: number[]) {
  const newPath = [...path];
  let chunk = structure;
  let index: number | undefined;
  do {
    index = newPath.splice(0, 1)[0];
    if (index != null) {
      if (chunk.items != null) {
        chunk = chunk.items[index];
      } else {
        throw Error('The given path leads out of the structure');
      }
    }
  } while (index != null);
  return chunk;
}

export function setNode(
  structure: TreeNodeStructure,
  path: number[],
  newNode: TreeNodeStructure,
) {
  const newPath = [...path];
  let chunk = structure;
  let index: number | undefined;

  if (newPath.length === 0) {
    throw Error('The given path is empty');
  }

  while (newPath.length > 0) {
    index = newPath.splice(0, 1)[0] as number;
    if (chunk.items != null) {
      if (newPath.length === 0) {
        chunk.items.splice(index, 0, newNode);
      } else {
        chunk = chunk.items[index];
      }
    } else {
      wlog('No children in path : ' + JSON.stringify(chunk));
    }
  }
}

export function removeNode(
  structure: TreeNodeStructure,
  fromPath: number[],
  toPath: number[],
) {
  // Check if the destination is above the removed element
  // If yes, it means that the element is one index further now
  const shorterLength = Math.min(fromPath.length, toPath.length);
  let depth = 0;

  while (depth < shorterLength - 1 && fromPath[depth] === toPath[depth]) {
    depth += 1;
  }

  const computedFromPath = [...fromPath];
  const fromIndex = fromPath[depth];
  const toIndex = toPath[depth];

  if (fromPath.length >= toPath.length && fromIndex >= toIndex) {
    computedFromPath[depth] += 1;
  }
  const indexToDelete = computedFromPath.slice(-1)[0];

  const parentToMove = getNode(structure, computedFromPath.slice(0, -1));
  if (parentToMove.items != null && indexToDelete != null) {
    parentToMove.items.splice(indexToDelete, 1);
  }
}

const ellipsisTextStyle = css({
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textAlign: 'left',
  margin: 0,
});

const labelWithIconStyle = css({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  width: '100%',
  overflow: 'hidden',
  'img, svg': {
    marginRight: '5px',
  },
});

interface LabelWithIconProps extends ClassStyleId {
  icon?: React.ReactNode;
  label: string;
}

export function LabelWithIcon({
  icon,
  label,
  className,
  style,
  id,
}: LabelWithIconProps) {
  return (
    <div
      id={id}
      style={style}
      className={cx(labelWithIconStyle, className ? className : '')}
    >
      {icon && icon}
      <p className={ellipsisTextStyle}>{label}</p>
    </div>
  );
}
