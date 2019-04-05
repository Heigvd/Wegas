import * as React from 'react';
import TreeNode, { treeHeadStyle } from './TreeNode';
import HandleUpDown from './HandleUpDown';

interface Item {
  label: string;
  value: string;
  selectable?: boolean;
  className?: string;
  items?: Item[];
}
interface TreeSelectProps {
  items: Item[];
  selected?: string;
  onSelect: (item: string) => void;
}

export function TreeSelect({ items, onSelect, selected }: TreeSelectProps) {
  const [updatedItems, setUpdatedItems] = React.useState<Item[]>([]);
  const onChildChange = React.useCallback((i: number) => {
    return (child: Item) =>
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
            key={item.value}
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
