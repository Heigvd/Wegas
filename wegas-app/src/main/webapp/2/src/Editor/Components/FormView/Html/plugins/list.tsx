import * as React from 'react';
import { hasBlock, Generated, ToolbarButtonProps, blockStack } from './tools';
import { IconButton } from '../../../../../Components/Button/IconButton';

export function bulletList(): Generated {
  return {
    name: 'block_ul',
    plugin: {
      renderNode(props) {
        switch (props.node.type) {
          case 'list_ul':
            return <ul {...props.attributes}>{props.children}</ul>;
          case 'list-item':
            return <li {...props.attributes}>{props.children}</li>;
        }
      },
    },
    transform: {
      serialize(obj, children) {
        if (obj.object === 'block' && obj.type === 'list_ul') {
          return <ul>{children}</ul>;
        }
        if (obj.object === 'block' && obj.type === 'list-item') {
          return <li>{children}</li>;
        }
      },
      deserialize(el, next) {
        if (el.tagName.toLowerCase() === 'ul') {
          return {
            object: 'block',
            type: 'list_ul',
            nodes: next(el.childNodes),
          };
        }
        if (el.tagName.toLowerCase() === 'li') {
          return {
            object: 'block',
            type: 'list-item',
            nodes: next(el.childNodes),
          };
        }
      },
    },
    Button({ value, onChange }: ToolbarButtonProps) {
      const enabled = hasBlock(value, 'list_ul');
      return (
        <IconButton
          icon="list-ul"
          pressed={enabled}
          onMouseDown={event => {
            event.preventDefault();
            onChange(
              value
                .change()
                .call(c => {
                  if (!enabled) {
                    blockStack(value).forEach(b => c.unwrapBlock(b));
                    c.setBlocks('list-item').wrapBlock('list_ul');
                  }
                  return c;
                })
                .focus(),
            );
          }}
        />
      );
    },
  };
}
