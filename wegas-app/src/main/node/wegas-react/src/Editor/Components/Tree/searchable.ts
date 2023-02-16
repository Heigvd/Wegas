interface SearchableTreeSelectProps<T> {
  items: TreeSelectItem<T>[];
  search: string;
  match?: (item: TreeSelectItem<T>, search: string) => boolean;
  render: (props: { items: any[] }) => JSX.Element;
}
function defaultSearchFn<T>(item: TreeSelectItem<T>, search: string) {
  return (
    JSON.stringify(item.value).toLowerCase().indexOf(search.toLowerCase()) > -1
  );
}

/**
 * @param items the item tree
 * @param search string to be matched against
 * @param match matching function
 * @returns a tree of matching elements. An element matches if it itself matches
 * or if any of its children matches. If an item matches then all its children are kept. 
 * If only some of its children matches only those are kept.
 */
function filterChildren<T>(
  items: TreeSelectItem<T>[],
  search: string,
  match: (item: TreeSelectItem<T>, search: string) => boolean,
): TreeSelectItem<T>[] {
  return items
    .map(i => {
      if (i.items) { // if the item has children
        const m = match(i, search);
        // recurse
        const childItems = filterChildren(i.items, search, match);

        // mark expanded only if item has matching children
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
    // keep element if it matches or if it has children
    .filter(i => i.match || (i.items && i.items.length));
}
export function SearchableItems<T>(props: SearchableTreeSelectProps<T>) {
  const { items, search, match = defaultSearchFn, render } = props;
  return render({
    items: search.trim() ? filterChildren(items, search.trim(), match) : items,
  });
}
