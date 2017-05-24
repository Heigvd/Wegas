import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import { css } from 'glamor';

const pointerStyle = css({
    cursor: 'pointer',
    ':hover': {
        background: 'lightgray'
    }
});

const selectedStyle = css({
    fontStyle: 'italic',
    color: 'pink'
});

const noDisplayStyle = css({
    display: 'none'
});

const noSelectStyle = css({
    fontStyle: 'italic',
    opacity: 0.7
});

const treeNodeContainerStyle = css({
    listStyle: 'none',
    '& a': {
        padding: '0 3px'
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
            borderLeft: '1px solid'
        }
    },

    '& &': {
        // margin: '0 0 0.5em 0',
        padding: '0 1.5em',
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
            left: 0
        },

        '&:last-child::before': {
            background: 'white',
            height: 'auto',
            top: '1em',
            bottom: 0
        }
    }
});

// Shared with TreeSelect:
export const treeHeadStyle = css({
    position: 'relative',
    ':focus': {
        outline: 'none',
        textDecoration: 'underline'
    }
});

function noop() {}

function update(props, val) {
    return {
        ...props,
        ...val
    };
}

export default function TreeNode(props) {
    const {
        label,
        value,
        expanded = false,
        items,
        className,
        match = true,
        onSelect = noop,
        selected,
        onChange = noop
    } = props;
    function toggle() {
        onChange(
            update(props, {
                expanded: !expanded
            })
        );
    }

    function handleSelect() {
        if (value) {
            onSelect(value);
        }
    }

    function onChildChange(i) {
        return function childChange(child) {
            onChange(
                update(props, {
                    items: [
                        ...items.slice(0, i),
                        child,
                        ...items.slice(i + 1, items.length)
                    ]
                })
            );
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
        <li className={cx(className, `${treeNodeContainerStyle}`)}>
            {items
                ? <a tabIndex="-1" className={pointerStyle} onClick={toggle}>
                      {expanded ? '\u25BC' : '\u25B6'}
                  </a>
                : null}
            <a
                tabIndex={match ? '0' : '-1'}
                onClick={handleSelect}
                onKeyDown={handleKeyDown}
                className={cx(treeHeadStyle.toString(), {
                    [noSelectStyle]: !value,
                    [pointerStyle]: value,
                    [selectedStyle]: selected && selected === value
                })}
            >
                {label !== undefined ? label : value}
            </a>
            {items
                ? <ul
                      className={cx({
                          // treeChildren style is undefined....
                          [noDisplayStyle]: !expanded
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
                : null}
        </li>
    );
}

TreeNode.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string,
    expanded: PropTypes.bool,
    selected: PropTypes.string,
    match: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.shape(TreeNode.propTypes)),
    onSelect: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string
};
