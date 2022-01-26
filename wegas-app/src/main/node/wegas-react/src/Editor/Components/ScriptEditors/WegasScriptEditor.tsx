// @ts-ignore
import { Monaco } from '@monaco-editor/react';
import * as React from 'react';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { useGlobalLibs } from '../../../Components/Hooks/useGlobalLibs';
import { librariesCTX } from '../LibrariesLoader';
import { ResizeHandle } from '../ResizeHandle';
import {
  arrayToText,
  MonacoCodeEditor,
  MonacoDefinitionsLibrary,
  MonacoEditor,
  MonacoEditorCursorEvent,
  MonacoEditorSimpleRange,
  MonacoSCodeEditor,
  SrcEditorAction,
  textToArray,
} from './editorHelpers';
import SrcEditor, { SrcEditorProps } from './SrcEditor';

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
  return `/* Please always respect the return type : ${cleanReturnType} */\n(${cleanArgs}) : ${cleanReturnType} => {\n\t`;
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

  const globalLibs = useGlobalLibs(scriptContext);
  const { clientScripts } = React.useContext(librariesCTX);
  const clientLibs: MonacoDefinitionsLibrary[] =
    scriptContext === 'Client'
      ? Object.entries(clientScripts).map(([k, v]) => ({
          name: `file:///${k}.ts`,
          content: v.content,
        }))
      : [];

  const extraLibs: MonacoDefinitionsLibrary[] = React.useMemo(
    () => [...(newExtraLibs || []), ...globalLibs, ...clientLibs],
    [clientLibs, globalLibs, newExtraLibs],
  );
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

  const editorProps: SrcEditorProps = {
    ...props,
    language,
    extraLibs,
    value: content,
    onEditorReady: editorLock,
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
