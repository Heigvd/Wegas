import { ReactNode } from 'react';

export type AcceptType = string | symbol;

export type AcceptTypes = AcceptType | AcceptType[];

export type TreeNodeStructure = {
  id: string;
  label: ReactNode;
  items?: TreeNodeStructure[];
};

export interface NodeBasicInfo<T> {
  parent?: T;
  index?: number;
}

export interface DropResult<T> {
  item: unknown;
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
