import React from 'react';
import cx from 'classnames';
import style from './Tree.css';

function noop() {
}


function update(props, val) {
    return {
        ...props,
        ...val
    };
}

export default function TreeNode(props) {
    const { label, value, expanded = false, selected = false, match = true, items, onSelect = noop, onChange = noop, className } = props;
    function toggle() {
        onChange(update(props, {
            expanded: !expanded
        }));
    }

    function handleSelect() {
        onSelect(value);
    }

    function onChildChange(i) {
        return function childChange(child) {
            onChange(update(props, {
                items: [
                    ...items.slice(0, i),
                    child,
                    ...items.slice(i + 1, items.length)
                ]
            }));
        };
    }


    function handleKeyDown(event) {
        switch (event.key) {
        case 'Enter':
            handleSelect();
            event.preventDefault();
            event.stopPropagation();
            break;
        case 'ArrowRight':
            if (!expanded) toggle();
            event.preventDefault();
            event.stopPropagation();
            break;
        case 'ArrowLeft':
            if (expanded) toggle();
            event.preventDefault();
            event.stopPropagation();
            break;
        default:

        }
        return false;
    }


    return (
        <li className={cx(className, style.treeNodeContainer)}>
            {items ?
                <a
                    tabIndex="-1"
                    className={style.pointer}
                    onClick={toggle}
                >
                    {expanded ? '\u25BC' : '\u25B6'}
                </a> : null}
            <a
                tabIndex={match ? '0' : '1'}
                onClick={handleSelect}
                onKeyDown={handleKeyDown}
                className={cx(style.pointer, style.treeHead, {
                    [style.selected]: selected === value
                })}
            >
                {label !== undefined ? label : value}
            </a>
            {items ?
                <ul
                    className={cx(style.treeChildren, {
                        [style['no-display']]: !expanded
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
                </ul> : null}
        </li>
    );
}
