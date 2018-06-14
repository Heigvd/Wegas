interface Item<T> {
  value: string;
  items?: T[];
}
interface SearchableTreeSelectProps<I extends Item<I>> {
  items: I[];
  search: string;
  match?: (item: I, search: string) => boolean;
  render: (props: { items: any[] }) => JSX.Element;
}
function defaultSearchFn<I extends Item<I>>(item: I, search: string) {
  return item.value.toLowerCase().indexOf(search.toLowerCase()) > -1;
}

function filterChildren<I extends Item<I>>(
  items: I[],
  search: string,
  match: (item: I, search: string) => boolean,
): I[] {
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
export function SearchableItems<I extends Item<I>>(props: SearchableTreeSelectProps<I>) {
  const { items, search, match = defaultSearchFn, render } = props;
  return render({
    items: search.trim() ? filterChildren(items, search.trim(), match) : items,
  });
}
