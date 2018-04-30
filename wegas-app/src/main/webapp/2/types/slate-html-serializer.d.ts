declare module 'slate-html-serializer' {
  import { Block, Node, Value } from 'slate';
  interface OJSON {
    type: string;
    key?: string;
    nodes?: Node[];
    isVoid?: boolean;
    data?: { [key: string]: any };
    object: 'block' | 'mark' | 'inline' | 'text';
  }
  interface Rule {
    deserialize: (
      el: Element,
      next: (children: Element['childNodes']) => Node[],
    ) => OJSON | undefined;
    serialize: (
      obj: OJSON,
      children: React.ReactChild,
    ) => JSX.Element | undefined;
  }
  export default class Html {
    constructor(options: {
      rules?: Rule[];
      defaultBlock?: string;
      parseHtml?: Function;
    });
    serialize(value: Value): string;
    deserialize(value: string): Value;
  }
}
