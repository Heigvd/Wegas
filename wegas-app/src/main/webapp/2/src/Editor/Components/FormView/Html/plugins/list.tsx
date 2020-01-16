import * as React from "react";
import { hasBlock, Generated, ToolbarButtonProps, blockStack } from "./tools";
import { IconButton } from "../../../../../Components/Inputs/Button/IconButton";
import { Block } from "slate";

export function bulletList(): Generated {
  return {
    name: "block_ul",
    plugin: {
      renderNode(props, _editor, next) {
        if (Block.isBlock(props.node)) {
          switch (props.node.type) {
            case "list_ul":
              return <ul {...props.attributes}>{props.children}</ul>;
            case "list-item":
              return <li {...props.attributes}>{props.children}</li>;
          }
        }
        return next();
      }
    },
    transform: {
      serialize(obj, children) {
        if (obj.object === "block" && obj.type === "list_ul") {
          return <ul>{children}</ul>;
        }
        if (obj.object === "block" && obj.type === "list-item") {
          return <li>{children}</li>;
        }
      },
      deserialize(el, next) {
        if (el.tagName.toLowerCase() === "ul") {
          return {
            object: "block",
            type: "list_ul",
            nodes: next(el.childNodes)
          };
        }
        if (el.tagName.toLowerCase() === "li") {
          return {
            object: "block",
            type: "list-item",
            nodes: next(el.childNodes)
          };
        }
      }
    },
    Button({ value, editor }: ToolbarButtonProps) {
      const enabled = hasBlock(value, "list_ul");
      return (
        <IconButton
          icon="list-ul"
          pressed={enabled}
          onMouseDown={event => {
            event.preventDefault();
            if (editor.current !== null) {
              if (!enabled) {
                blockStack(value).forEach(b => editor.current!.unwrapBlock(b));
                editor.current.setBlocks("list-item").wrapBlock("list_ul");
              }
              editor.current.focus();
            }
          }}
        />
      );
    }
  };
}
