import React from 'react';

function defaultSearchFn(item, search) {
    return item.value.toLowerCase().indexOf(search.toLowerCase()) > -1;
}

function matchNode(item, search, match) {
    return match(item, search) ||
        (item.items &&
        filterChildren(item.items, search, match).length); // eslint-disable-line
}

function filterChildren(items, search, match) {
    return items.filter(i => matchNode(i, search, match)).map((i) => {
        if (i.items) {
            const childItems = filterChildren(i.items, search, match);

            return {
                ...i,
                match: match(i, search),
                expanded: childItems.length,
                items: childItems
            };
        }
        return {
            ...i,
            match: match(i, search)
        };
    });
}

export default function searchableTree(Comp) {
    return function SearchableTreeSelect(props) {
        const { items, search, match = defaultSearchFn, ...rest } = props;
        return (<Comp
            {...rest}
            items={search.trim() ? filterChildren(items, search.trim(), match) : items}
        />);
    };
}
