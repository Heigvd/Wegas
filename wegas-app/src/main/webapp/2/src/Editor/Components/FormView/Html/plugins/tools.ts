import { Value, Editor, Block } from 'slate';
import { Plugin } from 'slate-react';
import { Rule } from 'slate-html-serializer';

export const hasMark = (value: Value, type: string) =>
  value.activeMarks.some(mark => mark != null && mark.type === type);

export const blockStack = (value: Value) => {
  const { document } = value;
  let p = value.blocks.first();
  if (!p) {
    return [];
  }
  const arr = [p];
  while (document.getParent(p.key) instanceof Block) {
    p = document.getParent(p.key) as Block;
    arr.push(p);
  }
  return arr;
};

export const hasBlock = (value: Value, type: string) =>
  blockStack(value).some(node => node != null && node.type == type);

export interface Generated {
  plugin: Plugin;
  transform: Rule;
  Button: React.SFC<{
    value: Value;
    editor: React.RefObject<Editor>;
  }>;
  name: string;
}
export interface ToolbarButtonProps {
  value: Value;
  editor: React.RefObject<Editor>;
  change?: (editor:Editor) => void;
}
