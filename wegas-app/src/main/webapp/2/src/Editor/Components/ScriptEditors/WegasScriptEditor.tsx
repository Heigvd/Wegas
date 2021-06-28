import * as React from 'react';
import SrcEditor, { SrcEditorProps } from './SrcEditor';
import { useGlobalLibs } from '../../../Components/Hooks/useGlobalLibs';

// @ts-ignore
import libes5 from '!!raw-loader!typescript/lib/lib.es5.d.ts';
// @ts-ignore
// import libes2015_core from "!!raw-loader!typescript/lib/lib.es2015.core.d.ts";
// @ts-ignore
// import libes2015_collection from "!!raw-loader!typescript/lib/lib.es2015.collection.d.ts";
// @ts-ignore
// import libes2015_iterable from "!!raw-loader!typescript/lib/lib.es2015.iterable.d.ts";
// @ts-ignore
// import libes2015_generator from "!!raw-loader!typescript/lib/lib.es2015.generator.d.ts";
// @ts-ignore
// import libes2015_promise from "!!raw-loader!typescript/lib/lib.es2015.promise.d.ts";
// @ts-ignore
// import libes2015_proxy from "!!raw-loader!typescript/lib/lib.es2015.proxy.d.ts";
// @ts-ignore
// import libes2015_reflect from "!!raw-loader!typescript/lib/lib.es2015.reflect.d.ts";
// @ts-ignore
// import libes2015_symbol from "!!raw-loader!typescript/lib/lib.es2015.symbol.d.ts";
// @ts-ignore
// import libes2015_symbol_wellknown from "!!raw-loader!typescript/lib/lib.es2015.symbol.wellknown.d.ts";

import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { ResizeHandle } from '../ResizeHandle';
import {
  textToArray,
  arrayToText,
  MonacoSCodeEditor,
  MonacoEditorSimpleRange,
  MonacoDefinitionsLibraries,
  MonacoEditorCursorEvent,
  SrcEditorAction,
  MonacoEditor,
  MonacoCodeEditor,
} from './editorHelpers';
import { Monaco } from '@monaco-editor/react';

export interface WegasScriptEditorProps extends SrcEditorProps {
  scriptContext?: ScriptContext;
  returnType?: WegasScriptEditorReturnTypeName[];
  resizable?: boolean;
  args?: [string, WegasScriptEditorReturnTypeName[]][];
}

const header = (
  returnType?: string[],
  args?: [string, WegasScriptEditorReturnTypeName[]][],
) => {
  const cleanArgs =
    args !== undefined ? args.map(arg => arg.join(':')).join(',') : '';
  const cleanReturnType =
    returnType !== undefined
      ? returnType.reduce(
          (o, t, i) => o + (i ? '|' : '') + t.replace(/\r?\n/, ''),
          '',
        )
      : '';
  return `/*\n *\tPlease always respect the return type : ${cleanReturnType}\n *\tPlease only write in JS even if the editor let you write in TS\n */\n(${cleanArgs}) : ${cleanReturnType} => {\n\t`;
};
const headerSize = textToArray(header()).length;
const footer = () => `\n};`;
const footerSize = textToArray(footer()).length - 1;

export const formatScriptToFunctionBody = (val: string) => {
  let newValue = val;
  // Removing first tab if exists
  if (newValue.length > 0 && newValue[0] === '\t') {
    newValue = newValue.substring(1);
  }
  const lines = textToArray(newValue);
  const tabber = lines.length > 1 ? '\t' : '';
  if (lines.length > 0 && !lines[lines.length - 1].includes('return')) {
    lines[lines.length - 1] = tabber + 'return ' + lines[lines.length - 1];
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(
      /\breturn /,
      tabber + 'return ',
    );
  }
  return arrayToText(lines);
};

/**
 * formatScriptToFunction - if the return type is defined, return the script wrapped in a function
 * @param val - The script value
 * @param returnType - The return type of the script
 */
const formatScriptToFunction = (
  val: string,
  returnType?: WegasScriptEditorReturnTypeName[],
  args?: [string, WegasScriptEditorReturnTypeName[]][],
) => {
  if (returnType !== undefined && returnType.length > 0) {
    const newValue = formatScriptToFunctionBody(val);
    return `${header(returnType, args)}${newValue}${footer()}`;
  }
  return val;
};

export function WegasScriptEditor(props: WegasScriptEditorProps) {
  const {
    value,
    returnType,
    args,
    scriptContext = 'Client',
    onChange,
    onBlur,
    onSave,
    resizable,
    extraLibs: newExtraLibs,
    defaultActions,
  } = props;
  const language = props.language ? props.language : 'typescript';
  let editorLock: ((editor: MonacoSCodeEditor) => void) | undefined = undefined;
  const editorRef = React.useRef<MonacoSCodeEditor>();
  const selectionRef = React.useRef<MonacoEditorSimpleRange>({
    startColumn: 1,
    endColumn: 1,
    startLineNumber: headerSize,
    endLineNumber: headerSize,
  });

  /**
   * acceptFunctionStyle - Returning false if return type needed and function is not parsable
   * Verifies if the user didn't delete header, footer and return statement.
   * @param val - The new script value
   * @param returnType - The script return type needed
   */
  const acceptFunctionStyle = (
    val?: string,
    returnType?: WegasScriptEditorReturnTypeName[],
    args?: [string, WegasScriptEditorReturnTypeName[]][],
  ) => {
    const newVal = val ? val : '';
    if (returnType !== undefined && returnType.length > 0) {
      const lines = textToArray(newVal);
      if (
        // Header protection
        arrayToText(lines.slice(0, headerSize - 1)) !==
          header(returnType, args).slice(0, -2) ||
        // Footer protection
        (lines.length > 0 &&
          lines[lines.length - footerSize] !== footer().substr(1)) ||
        // Return protection
        (lines.length > 1 &&
          lines[lines.length - footerSize - 1].search(/(\t|\n| )(return )/) ===
            -1)
      ) {
        return false;
      }
    }
    return true;
  };

  /**
   * trimFunctionToScript - If return type defined this function will trim the header, footer and return statement of the function and call back with only script value
   * @param val - The content of the editor
   * @param fn - the callback function
   */
  const trimFunctionToScript = React.useCallback(
    (val?: string, fn?: (val: string) => void) => {
      let newValue = val ? val : '';
      if (returnType !== undefined && returnType.length > 0) {
        if (acceptFunctionStyle(newValue, returnType, args)) {
          const newLines = textToArray(newValue)
            /* Removes header and footer */
            .filter(
              (_line, index, array) =>
                index >= headerSize - 1 && index < array.length - footerSize,
            );

          // Removing the last return statement (space and tabs before included)
          const lastReturnIndex = newLines.findIndex(
            val => val.includes('return'),
            -1,
          );
          if (lastReturnIndex > -1) {
            newLines[lastReturnIndex] = newLines[lastReturnIndex].replace(
              /(\n|\t| )*(return )/,
              '',
            );
          }
          newValue = arrayToText(newLines);
          // setCurrentValue(newValue);
          return fn && fn(newValue);
        }
        return;
      }
      // setCurrentValue(newValue);
      return fn && fn(newValue);
    },
    [returnType, args],
  );

  const globalLibs = useGlobalLibs(scriptContext);

  const extraLibs: MonacoDefinitionsLibraries[] = React.useMemo(
    () => [
      ...(newExtraLibs || []),
      ...globalLibs,
      {
        name: 'defaultLib:lib.d.ts',
        content: libes5,
        // + libes2015_collection
        // + libes2015_core
        // + libes2015_generator
        // + libes2015_iterable
        // + libes2015_promise
        // + libes2015_proxy
        // + libes2015_reflect
        // + libes2015_symbol
        // + libes2015_symbol_wellknown
      },
    ],
    [globalLibs, newExtraLibs],
  );

  if (returnType !== undefined && returnType.length > 0) {
    editorLock = (editor: MonacoSCodeEditor) => {
      editorRef.current = editor;
      // Allow to make lines of the editor readonly
      editor.onDidChangeCursorSelection((e: MonacoEditorCursorEvent) => {
        if (deepDifferent(selectionRef.current, e.selection)) {
          const textLines = textToArray(editor.getValue()).length;
          const trimStartUp = e.selection.startLineNumber < headerSize;
          const trimStartDown =
            e.selection.startLineNumber > textLines - footerSize;
          const trimEndUp = e.selection.endLineNumber < headerSize;
          const trimEndDown =
            e.selection.endLineNumber > textLines - footerSize;

          if (trimStartUp || trimStartDown || trimEndUp || trimEndDown) {
            editor.setSelection(selectionRef.current);
          } else {
            selectionRef.current = e.selection;
          }
        }
      });
    };
  }

  const actions: (monaco: Monaco) => SrcEditorAction[] = monaco => [
    ...(defaultActions ? defaultActions(monaco) : []),
    ...(returnType && returnType.length > 0
      ? [
          {
            id: 'SelectAllWithScriptFunction',
            label: 'Ctrl + A avoiding header and footer',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_A],
            run: (_monaco: MonacoEditor, editor: MonacoCodeEditor) => {
              const editorLines = textToArray(editor.getValue());
              const lastEditableLine =
                textToArray(editor.getValue()).length - footerSize;
              const range = {
                startColumn: 1,
                endColumn: editorLines[lastEditableLine - 1].length,
                startLineNumber: headerSize,
                endLineNumber: lastEditableLine,
              };
              editor.setSelection(range);
            },
          },
        ]
      : []),
  ];

  const handleChange = React.useCallback(
    val => {
      return trimFunctionToScript(val, onChange);
    },
    [onChange, trimFunctionToScript],
  );
  const handleBlur = React.useCallback(
    val => {
      trimFunctionToScript(val, onBlur);
    },
    [onBlur, trimFunctionToScript],
  );
  const handleSave = React.useCallback(
    val => trimFunctionToScript(val, onSave),
    [onSave, trimFunctionToScript],
  );

  const content = formatScriptToFunction(value || '', returnType, args);

  // return (
  //   <SrcEditor
  //     {...props}
  //     language={language}
  //     extraLibs={extraLibs}
  //     value={content}
  //     onEditorReady={editorLock}
  //     onChange={handleChange}
  //     onBlur={onBlur}
  //     onSave={onSave}
  //     defaultActions={actions}
  //   />
  // );

  const editorProps: SrcEditorProps = {
    ...props,
    language,
    extraLibs,
    value: content,
    onEditorReady: editorLock,
    // onChange,
    // onBlur,
    // onSave,
    onChange: handleChange,
    onBlur: handleBlur,
    onSave: handleSave,
    defaultActions: actions,
  };

  return resizable ? (
    <ResizeHandle minSize={100} textContent={content}>
      <SrcEditor {...editorProps} />
    </ResizeHandle>
  ) : (
    <SrcEditor {...editorProps} />
  );
}
