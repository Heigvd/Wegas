import * as React from 'react';
import SrcEditor, { SrcEditorProps } from './SrcEditor';
import { useMonacoEditor } from '../../../Components/Hooks/useMonacoEditor';
import { useGlobalLibs } from '../../../Components/Hooks/useGlobalLibs';
import { libes5 } from '../../../Helper/libs';
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

export interface WegasScriptEditorProps extends SrcEditorProps {
  clientScript?: boolean;
  returnType?: WegasScriptEditorReturnTypeName[];
  resizable?: boolean;
}

const header = (type?: string[]) => {
  const cleanType =
    type !== undefined
      ? type.reduce(
          (o, t, i) => o + (i ? '|' : '') + t.replace(/\r?\n/, ''),
          '',
        )
      : '';
  return `/*\n *\tPlease always respect the return type : ${cleanType}\n *\tPlease only write in JS even if the editor let you write in TS\n */\n() : ${cleanType} => {\n\t`;
};
const headerSize = textToArray(header()).length;
const footer = () => `\n};`;
const footerSize = textToArray(footer()).length - 1;

/**
 * formatScriptToFunction - if the return type is defined, return the script wrapped in a function
 * @param val - The script value
 * @param returnType - The return type of the script
 */
const formatScriptToFunction = (
  val: string,
  returnType?: WegasScriptEditorReturnTypeName[],
) => {
  if (returnType !== undefined && returnType.length > 0) {
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
        /.*(return).* /,
        tabber + 'return ',
      );
    }
    newValue = arrayToText(lines);
    return `${header(returnType)}${newValue}${footer()}`;
  }
  return val;
};

export function WegasScriptEditor(props: WegasScriptEditorProps) {
  const {
    value,
    returnType,
    /*TODO : allow non server methods here clientScript,*/ onChange,
    onBlur,
    onSave,
    resizable,
    extraLibs: newExtraLibs,
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
  // const [currentValue, setCurrentValue] = React.useState<string>(value || '');
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const toggleRefresh = React.useCallback(() => setRefresh(old => !old), [
    setRefresh,
  ]);
  const monaco = useMonacoEditor();

  /**
   * acceptFunctionStyle - Returning false if return type needed and function is not parsable
   * Verifies if the user didn't delete header, footer and return statement.
   * @param val - The new script value
   * @param returnType - The script return type needed
   */
  const acceptFunctionStyle = (
    val?: string,
    returnType?: WegasScriptEditorReturnTypeName[],
  ) => {
    const newVal = val ? val : '';
    if (returnType !== undefined && returnType.length > 0) {
      const lines = textToArray(newVal);
      if (
        // Header protection
        arrayToText(lines.slice(0, headerSize - 1)) !==
          header(returnType).slice(0, -2) ||
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
        if (acceptFunctionStyle(newValue, returnType)) {
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
        // If the user deleted the function's header, footer or return statement, the value is rolled back
        toggleRefresh();
        return;
      }
      // setCurrentValue(newValue);
      return fn && fn(newValue);
    },
    [returnType, toggleRefresh],
  );

  const globalLibs = useGlobalLibs();

  const extraLibs: MonacoDefinitionsLibraries[] = [
    ...(newExtraLibs || []),
    ...globalLibs,
    { name: 'defaultLib:lib.d.ts', content: libes5 },
  ];

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

  const actions: SrcEditorAction[] =
    returnType && returnType.length > 0 && monaco
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
      : [];

  const handleChange = React.useCallback(
    val => trimFunctionToScript(val, onChange),
    [onChange, trimFunctionToScript],
  );
  const handleBlur = React.useCallback(
    val => trimFunctionToScript(val, onBlur),
    [onBlur, trimFunctionToScript],
  );
  const handleSave = React.useCallback(
    val => trimFunctionToScript(val, onSave),
    [onSave, trimFunctionToScript],
  );

  const content = formatScriptToFunction(value || '', returnType);
  const editor = (
    <SrcEditor
      key={Number(refresh)}
      {...props}
      language={language}
      extraLibs={extraLibs}
      value={content}
      onEditorReady={editorLock}
      onChange={v => handleChange(v)}
      onBlur={handleBlur}
      onSave={handleSave}
      defaultActions={actions}
    />
  );

  return resizable ? (
    <ResizeHandle minSize={100} textContent={content}>
      {editor}
    </ResizeHandle>
  ) : (
    editor
  );
}
