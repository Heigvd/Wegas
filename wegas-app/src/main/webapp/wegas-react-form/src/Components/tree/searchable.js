import React, { PropTypes } from 'react';

function defaultSearchFn(item, search) {
    return item.value.toLowerCase().indexOf(search.toLowerCase()) > -1;
}

function matchNode(item, search, matchFn) {
    return (matchFn(item, search) && item.value) || (
        item.items &&
        filterChildren(item.items, search, matchFn).length); // eslint-disable-line
}

function filterChildren(items, search, match) {
    return items.filter(i => matchNode(i, search, match)).map((i) => {
        if (i.items) {
            const childItems = filterChildren(i.items, search, match);

            return {
                ...i,
                match: match(i, search),
                expanded: Boolean(childItems.length),
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
    function SearchableTreeSelect(props) {
        const {
            items,
            search,
            match = defaultSearchFn,
            ...rest
        } = props;
        return (
            <Comp
                {...rest}
                items={search.trim() ?
                               filterChildren(items, search.trim(), match) :
                               items}
            />);
    }

    SearchableTreeSelect.propTypes = {
        items: PropTypes.arrayOf(PropTypes.object).isRequired,
        search: PropTypes.string,
        match: PropTypes.func
    };
    return SearchableTreeSelect;
}
