import * as React from 'react';
import TreeNode, { treeHeadStyle } from './TreeNode';
import HandleUpDown from './HandleUpDown';

export interface Item<T> {
  label: React.ReactNode;
  value?: T;
  selectable?: boolean;
  items?: Item<T>[];
  className?: string;
}

interface TreeSelectProps<T> {
  items: Item<T>[];
  selected?: T;
  onSelect?: (item: T) => void;
}

export function TreeSelect<T>({
  items,
  onSelect,
  selected,
}: TreeSelectProps<T>) {
  const [updatedItems, setUpdatedItems] = React.useState<Item<T>[]>([]);
  const onChildChange = React.useCallback((i: number) => {
    return (child: Item<T>) =>
      setUpdatedItems(items => [
        ...items.slice(0, i),
        child,
        ...items.slice(i + 1, items.length),
      ]);
  }, []);
  React.useEffect(() => {
    setUpdatedItems(items);
  }, [items]);
  return (
    <HandleUpDown selector={'.' + treeHeadStyle}>
      {[
        updatedItems.map((item, index) => (
          <TreeNode
            key={JSON.stringify(item.value)}
            {...item}
            selected={selected}
            onSelect={onSelect}
            onChange={onChildChange(index)}
          />
        )),
      ]}
    </HandleUpDown>
  );
}
