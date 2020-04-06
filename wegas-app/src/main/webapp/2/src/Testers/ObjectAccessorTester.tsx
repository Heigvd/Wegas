import * as React from 'react';
import { expandBoth, flex, flexColumn, grow } from '../css/classes';
import { cx, css } from 'emotion';
import { WegasScriptEditor } from '../Editor/Components/ScriptEditors/WegasScriptEditor';
import { cloneDeep } from 'lodash-es';
import { createSandbox } from '../Components/Hooks/useScript';
import { transpile } from 'typescript';

const { sandbox, globals } = createSandbox<{
  getObject: typeof getObject;
  setObject: typeof setObject;
}>();

function evaluate(script: string) {
  try {
    return (
      ((sandbox.contentWindow as unknown) as {
        eval: (code: string) => unknown;
      })
        // 'undefined' so that an empty script don't return '"use strict"'
        .eval('"use strict";undefined;' + transpile(script))
    );
  } catch (e) {
    return undefined;
  }
}

function getObject(object: any, keys: string[]): any {
  const newKeys = [...keys];
  let entry: any = object;
  while (newKeys.length > 0) {
    const key = newKeys.shift();
    if (
      key == null ||
      entry == null ||
      typeof entry !== 'object' ||
      !(key in entry)
    ) {
      return undefined;
    } else {
      entry = entry[key];
    }
  }
  return entry;
}
globals.getObject = getObject;

function setObject<T>(
  object: T,
  value: any,
  keys: string[],
  noOverride: boolean = false,
): T | undefined {
  const newKeys = [...keys];
  const newObject = cloneDeep(object);
  let entry: any = newObject;
  while (newKeys.length > 0) {
    const key = newKeys.shift();
    if (key == null || entry == null || typeof entry !== 'object') {
      return undefined;
    } else if (newKeys.length > 0) {
      if (!noOverride && typeof entry[key] !== 'object') {
        entry[key] = {};
      }
      entry = entry[key];
    } else {
      entry[key] = value;
      return newObject;
    }
  }
  return undefined;
}
globals.setObject = setObject;

const objectaccesslib = `
  declare function getObject(object: any, keys: string[]): any;
  declare function setObject<T>(object: T, value: any, keys: string[], noOverride: boolean = false): T | undefined;
  `;

const testcontent = `
const testobject = {
  salut: 'Salut!!!',
  more: {
    a: 1,
    b: 2,
  },
};

// getObject(testobject,["more","b"])
setObject(testobject,"Added",[])
`;

export default function ObjectAccessorTester() {
  const [content, setContent] = React.useState<string>(testcontent);

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div className={css({ height: '400px' })}>
        <WegasScriptEditor
          language="typescript"
          value={content}
          onChange={setContent}
          extraLibs={[
            {
              name: 'ObjectAccess.d.ts',
              content: objectaccesslib,
            },
          ]}
        />
      </div>
      <div className={grow}>{JSON.stringify(evaluate(content))}</div>
    </div>
  );
}
