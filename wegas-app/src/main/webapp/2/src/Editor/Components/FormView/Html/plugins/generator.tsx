import * as React from 'react';
import { Value, Editor, Block } from 'slate';
import { Props } from '@fortawesome/react-fontawesome';
import {
  Generated,
  hasMark,
  hasBlock,
  ToolbarButtonProps,
  blockStack,
} from './tools';
import { IconButton } from '../../../../../Components/Inputs/Button/IconButton';

export function genMark({
  render,
  mark,
  htmlIsMark,
  buttonIcon,
}: {
  render: (props: { children: React.ReactNode }) => JSX.Element;
  mark: string;
  htmlIsMark: (el: Element) => boolean;
  buttonIcon: Props['icon'];
}): Generated {
  return {
    name: `Mark_${mark}`,
    plugin: {
      renderMark(props, _editor, next) {
        if (props.mark.type === mark) {
          return render({ ...props.attributes, children: props.children });
        }
        return next();
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
      editor,
    }: {
      editor: React.RefObject<Editor>;
      value: Value;
    }) {
      const enabled = hasMark(value, mark);
      return (
        <IconButton
          icon={buttonIcon}
          pressed={enabled}
          onMouseDown={event => {
            event.preventDefault();
            if (editor.current !== null) {
              editor.current.toggleMark(mark).focus();
            }
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
  buttonIcon: Props['icon'];
}): Generated {
  return {
    name: `Block_${block}`,
    plugin: {
      renderNode(props, _editor, next) {
        if (Block.isBlock(props.node) && props.node.type === block) {
          return render({ ...props.attributes, children: props.children });
        }
        return next();
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
      editor,
      change = (editor) => {
        if (editor !== null) {
          if (!hasBlock(value, block)) {
            blockStack(value).forEach(b => editor.unwrapBlock(b));
            editor.setBlocks(block);
          }
        }
      },
    }: ToolbarButtonProps) {
      const enabled = hasBlock(value, block);
      return (
        <IconButton
          icon={buttonIcon}
          pressed={enabled}
          onMouseDown={event => {
            event.preventDefault();
            if (editor.current !== null) {
              change(editor.current);
              editor.current.focus();
            }
          }}
        />
      );
    },
  };
}
