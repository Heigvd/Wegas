interface Item {
    value: string;
    items?: Item[];
}
interface SearchableTreeSelectProps {
    items: Item[];
    search: string;
    match: (item: any, search: string) => boolean;
    render: (props: { items: any[] }) => JSX.Element;
}
function defaultSearchFn(item: Item, search: string) {
    return item.value.toLowerCase().indexOf(search.toLowerCase()) > -1;
}

function filterChildren(
    items: Item[],
    search: string,
    match: (item: Item, search: string) => boolean,
): Item[] {
    return items
        .map(i => {
            if (i.items) {
                const m = match(i, search);
                const childItems = filterChildren(i.items, search, match);

                return {
                    ...i,
                    match: m,
                    expanded: Boolean(childItems.length),
                    items: m ? i.items : childItems,
                };
            }
            return {
                ...i,
                match: match(i, search),
            };
        })
        .filter(i => i.match || (i.items && i.items.length));
}
export default function SearchableTreeSelect(props: SearchableTreeSelectProps) {
    const { items, search, match = defaultSearchFn, render } = props;
    return render({
        items: search.trim() ? filterChildren(items, search.trim(), match) : items,
    });
    // <Comp
    //     {...rest}
    //     items={
    //         search.trim()
    //             ? filterChildren(items, search.trim(), match)
    //             : items
    //     }
    // />
}
