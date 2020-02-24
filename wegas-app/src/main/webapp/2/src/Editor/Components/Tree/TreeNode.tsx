import * as React from 'react';
import { css, cx } from 'emotion';
import { IconButton } from '../../../Components/Inputs/Button/IconButton';

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
  margin: 0,
  '& a': {
    padding: '0 3px',
  },

  '& > ul': {
    margin: 0,
    padding: 0,
    marginLeft: '1em',
    listStyle: 'none',
    position: 'relative',

    ':before': {
      content: '""',
      display: 'block',
      width: 0,
      position: 'absolute',
      top: 0,
      bottom: '1em',
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
      content: '""',
      display: 'block',
      width: '1em',
      height: 0,
      borderTop: '1px solid',
      position: 'absolute',
      top: '1em',
      left: 0,
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

function update<T>(
  props: TreeNodeProps<T>,
  val: Partial<TreeNodeProps<T>>,
): TreeNodeProps<T> {
  return {
    ...props,
    ...val,
  };
}
interface TreeNodeProps<T> {
  label: string;
  value: T;
  expanded?: boolean;
  selected?: T;
  selectable?: boolean;
  match?: boolean;
  items?: TreeNodeProps<T>[];
  onSelect?: (item: T) => void;
  onChange?: (props: TreeNodeProps<T>) => void;
  className?: string;
}
export default function TreeNode<T>(props: TreeNodeProps<T>): JSX.Element {
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
    return function childChange(child: TreeNodeProps<T>) {
      if (items == null) {
        return;
      }
      onChange(
        update(props, {
          items: [
            ...items.slice(0, i),
            child,
            ...items.slice(i + 1, items.length),
          ],
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
    <li className={`${className || ''} ${treeNodeContainerStyle}`}>
      {items ? (
        <IconButton
          icon={expanded ? 'caret-down' : 'caret-right'}
          tabIndex={-1}
          onClick={toggle}
        />
      ) : null}
      <a
        tabIndex={match ? 0 : -1}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        className={`${treeHeadStyle} ${cx({
          [noSelectStyle]: !selectable,
          [pointerStyle]: selectable,
          [selectedStyle]:
            !!selected && JSON.stringify(selected) === JSON.stringify(value),
        })}`}
      >
        {label !== undefined
          ? label
          : typeof value === 'string'
          ? value
          : JSON.stringify(value)}
      </a>
      {items ? (
        <ul
          className={cx({
            [noDisplayStyle]: !expanded,
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
