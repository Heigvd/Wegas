import { css, cx } from '@emotion/css';
import { useMonaco } from '@monaco-editor/react';
import * as React from 'react';
import { transpile } from 'typescript';
import { createOrUpdateModel } from '../Components/Contexts/LibrariesContext';
import { createSandbox } from '../Components/Hooks/sandbox';
import { TempScriptEditor } from '../Components/ScriptEditors/TempScriptEditor';
import { expandBoth, flex, flexColumn, grow } from '../css/classes';
import { getEntry, setEntry } from '../Helper/tools';

const { sandbox, globals } = createSandbox<{
  getEntry: typeof getEntry;
  setEntry: typeof setEntry;
}>();

function evaluate(script: string) {
  try {
    return (
      (
        sandbox.contentWindow as unknown as {
          eval: (code: string) => unknown;
        }
      )
        // 'undefined' so that an empty script don't return '"use strict"'
        .eval('"use strict";undefined;' + transpile(script))
    );
  } catch (e) {
    return undefined;
  }
}

globals.getEntry = getEntry;
globals.setEntry = setEntry;

const objectaccesslib = `
  /**
   * getEntry - get an entry of object from and array of keys. Allows to go deep in an object without the use of brackets [][][]
   * @returns the value at of the searched entry or undefined
   * @param object any object
   * @param keyPath an array of keys to acces entry
   * @param lookupKey if the searched object is made from intermediate objects, allows to look up in the intermediate object.
   */
  declare function getEntry(object: any, keyPath: string[], lookupKey?: string ): any;

  /**
   * setEntry - allows to set and object entry deep inside the object without the use of brackets [][][]7
   * @returns a new object with the created/modified entry or undefined (no keys or noOverride used and key allready taken)
   * @param object any object
   * @param value any value to insert
   * @param keyPath an array of keys to acces entry
   * @param defaultObjectItem an object that describes the entry pattern and a lookup key to find the next entry
   * @param noOverride if set to true, en entry that already contains something will not be overriden
   */
  declare function setEntry<T, I>(
    object: T,
    value: I,
    keyPath: string[],
    defaultObjectItem?: { defaultObject: I; lookupKey: keyof I },
    noOverride: boolean = false,
  ): T | undefined;
`;

const testcontent = `
const testobject = {
  salut: {value:'Salut!!!',index:1},
  more: {value:{mama:{value:'MAMAA!!!',index:3}},index:2},
};

// getEntry(testobject,["more","b"])
setEntry(testobject,{value:"YOOMAMA",index:666},["more","mama"],{defaultObject:{value:"def",index:0},lookupKey:"value"})
`;

export default function ObjectAccessorTester() {
  const [content, setContent] = React.useState<string>(testcontent);

  const reactMonaco = useMonaco();
  if (reactMonaco) {
    createOrUpdateModel(
      reactMonaco,
      objectaccesslib,
      'typescript',
      'file:///ObjectAccess.d.ts',
    );
  }

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div className={css({ height: '400px' })}>
        <TempScriptEditor
          language="typescript"
          onChange={setContent}
          initialValue={testcontent}
        />
      </div>
      <div className={grow}>{JSON.stringify(evaluate(content))}</div>
    </div>
  );
}
