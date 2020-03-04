import { Item } from './TreeSelect';

interface SearchableTreeSelectProps<T> {
  items: Item<T>[];
  search: string;
  match?: (item: Item<T>, search: string) => boolean;
  render: (props: { items: any[] }) => JSX.Element;
}
function defaultSearchFn<T>(item: Item<T>, search: string) {
  return (
    JSON.stringify(item.value)
      .toLowerCase()
      .indexOf(search.toLowerCase()) > -1
  );
}

function filterChildren<T>(
  items: Item<T>[],
  search: string,
  match: (item: Item<T>, search: string) => boolean,
): Item<T>[] {
  return items
    .map(i => {
      if (i.items) {
        const m = match(i, search);
        const childItems = filterChildren(i.items, search, match);

        return Object.assign({}, i, {
          match: m,
          expanded: Boolean(childItems.length),
          items: m ? i.items : childItems,
        });
      }
      return Object.assign({}, i, {
        match: match(i, search),
      });
    })
    .filter(i => i.match || (i.items && i.items.length));
}
export function SearchableItems<T>(props: SearchableTreeSelectProps<T>) {
  const { items, search, match = defaultSearchFn, render } = props;
  return render({
    items: search.trim() ? filterChildren(items, search.trim(), match) : items,
  });
}
