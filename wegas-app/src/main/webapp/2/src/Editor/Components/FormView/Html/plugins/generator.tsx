import * as React from 'react';
import { Value, Change } from 'slate';
import { IconProp } from '@fortawesome/fontawesome';
import {
  Generated,
  hasMark,
  hasBlock,
  ToolbarButtonProps,
  blockStack,
} from './tools';
import { IconButton } from '../../../../../Components/Button/IconButton';

export function genMark({
  render,
  mark,
  htmlIsMark,
  buttonIcon,
}: {
  render: (props: { children: React.ReactNode }) => JSX.Element;
  mark: string;
  htmlIsMark: (el: Element) => boolean;
  buttonIcon: IconProp;
}): Generated {
  return {
    name: `Mark_${mark}`,
    plugin: {
      renderMark(props) {
        if (props.mark.type === mark) {
          return render(props);
        }
      },
    },
    transform: {
      serialize(obj, children) {
        if (obj.type === mark && obj.object === 'mark') {
          return render({ children });
        }
      },
      deserialize(el, next) {
        if (htmlIsMark(el))
          return {
            object: 'mark',
            type: mark,
            nodes: next(el.childNodes),
          };
      },
    },
    Button({
      value,
      onChange,
    }: {
      value: Value;
      onChange: (value: Change) => void;
    }) {
      const enabled = hasMark(value, mark);
      return (
        <IconButton
          icon={buttonIcon}
          pressed={enabled}
          onMouseDown={event => {
            event.preventDefault();
            onChange(
              value
                .change()
                .toggleMark(mark)
                .focus(),
            );
          }}
        />
      );
    },
  };
}
export function genBlock({
  render,
  block,
  htmlIsBlock,
  buttonIcon,
}: {
  render: (
    props: { children: React.ReactNode; [prop: string]: any },
  ) => JSX.Element;
  block: string;
  htmlIsBlock: (el: Element) => boolean;
  buttonIcon: IconProp;
}): Generated {
  return {
    name: `Block_${block}`,
    plugin: {
      renderNode(props) {
        if (props.node.type === block) {
          return render({ ...props.attributes, children: props.children });
        }
      },
    },
    transform: {
      serialize(obj, children) {
        if (obj.type === block && obj.object === 'block') {
          return render({ children });
        }
      },
      deserialize(el, next) {
        if (htmlIsBlock(el))
          return {
            object: 'block',
            type: block,
            nodes: next(el.childNodes),
          };
      },
    },
    Button({
      value,
      onChange,
      change = c => {
        if (!hasBlock(value, block)) {
          blockStack(value).forEach(b => c.unwrapBlock(b));
          c.setBlocks(block);
        }
        return c;
      },
    }: ToolbarButtonProps) {
      const enabled = hasBlock(value, block);
      return (
        <IconButton
          icon={buttonIcon}
          pressed={enabled}
          onMouseDown={event => {
            event.preventDefault();
            onChange(
              value
                .change()
                .call(change as any)
                .focus(),
            );
          }}
        />
      );
    },
  };
}
