import React from 'react';
import cx from 'classnames';
import { css } from 'glamor';

const pointerStyle = css({
    cursor: 'pointer',
    ':hover': {
        background: 'lightgray',
    },
});

const selectedStyle = css({
    fontWeight: 'bolder',
});

const noDisplayStyle = css({
    display: 'none',
});

const noSelectStyle = css({
    fontStyle: 'italic',
    opacity: 0.7,
});

const treeNodeContainerStyle = css({
    listStyle: 'none',
    whiteSpace: 'nowrap',

    '& a': {
        padding: '0 3px',
    },

    '& > ul': {
        marginLeft: '.5em',
        listStyle: 'none',
        position: 'relative',

        ':before': {
            content: '',
            display: 'block',
            width: 0,
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            borderLeft: '1px solid',
        },
    },

    '& &': {
        // margin: '0 0 0.5em 0',
        paddingLeft: '1em',
        lineHeight: '2em',
        position: 'relative',

        '&::before': {
            content: '',
            display: 'block',
            width: '10px',
            height: 0,
            borderTop: '1px solid',
            marginTop: '-1px',
            position: 'absolute',
            top: '1em',
            left: 0,
        },

        '&:last-child::before': {
            background: 'white',
            height: 'auto',
            top: '1em',
            bottom: 0,
        },
    },
});

// Shared with TreeSelect:
export const treeHeadStyle = css({
    position: 'relative',
    ':focus': {
        outline: 'none',
        textDecoration: 'underline',
    },
});

function noop() {
    return;
}

function update(props: TreeNodeProps, val: Partial<TreeNodeProps>): TreeNodeProps {
    return {
        ...props,
        ...val,
    };
}
interface TreeNodeProps {
    label: string;
    value: string;
    expanded?: boolean;
    selected?: string;
    selectable?: boolean;
    match?: boolean;
    items?: TreeNodeProps[];
    onSelect?: (item: string) => void;
    onChange?: (props: TreeNodeProps) => void;
    className?: string;
}
export default function TreeNode(props: TreeNodeProps): JSX.Element {
    const {
        label,
        value,
        selectable = true,
        expanded = false,
        items,
        className,
        match = true,
        onSelect = noop,
        selected,
        onChange = noop,
    } = props;
    function toggle() {
        onChange(
            update(props, {
                expanded: !expanded,
            }),
        );
    }

    function handleSelect() {
        if (selectable) {
            onSelect(value);
        }
    }

    function onChildChange(i: number) {
        return function childChange(child: TreeNodeProps) {
            if (items == null) {
                return;
            }
            onChange(
                update(props, {
                    items: [...items.slice(0, i), child, ...items.slice(i + 1, items.length)],
                }),
            );
        };
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        switch (event.key) {
            case 'Enter':
                handleSelect();
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'ArrowRight':
                if (!expanded) {
                    toggle();
                }
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'ArrowLeft':
                if (expanded) {
                    toggle();
                }
                event.preventDefault();
                event.stopPropagation();
                break;
            default:
        }
        return false;
    }

    return (
        <li className={cx(className, `${treeNodeContainerStyle}`)}>
            {items ? (
                <a tabIndex={-1} className={pointerStyle.toString()} onClick={toggle}>
                    {expanded ? '\u25BC' : '\u25B6'}
                </a>
            ) : null}
            <a
                tabIndex={match ? 0 : -1}
                onClick={handleSelect}
                onKeyDown={handleKeyDown}
                className={cx(treeHeadStyle.toString(), {
                    [noSelectStyle.toString()]: !selectable,
                    [pointerStyle.toString()]: selectable,
                    [selectedStyle.toString()]: !!selected && selected === value,
                })}
            >
                {label !== undefined ? label : value}
            </a>
            {items ? (
                <ul
                    className={cx({
                        // treeChildren style is undefined....
                        [noDisplayStyle.toString()]: !expanded,
                    })}
                >
                    {items.map((c, i) => (
                        <TreeNode
                            {...c}
                            key={String(i)}
                            onSelect={onSelect}
                            selected={selected}
                            onChange={onChildChange(i)}
                        />
                    ))}
                </ul>
            ) : null}
        </li>
    );
}
