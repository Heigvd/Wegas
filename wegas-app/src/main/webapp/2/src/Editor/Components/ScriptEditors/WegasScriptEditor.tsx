import * as React from 'react';
import SrcEditor, {
  MonacoSCodeEditor,
  textToArray,
  arrayToText,
} from './SrcEditor';
import { EditorProps } from './SrcEditor';
import { useStore } from '../../../data/store';
import { shallowDifferent, deepDifferent } from '../../../data/connectStore';
import { State } from '../../../data/Reducer/reducers';
import { KeyMod, KeyCode } from 'monaco-editor';

// using raw-loader works but you need to put the whole file name and ts doesn't like it
// @ts-ignore
import entitiesSrc from '!!raw-loader!../../../../types/generated/WegasScriptableEntities.d.ts';

type MonacoEditorCursorEvent = import('monaco-editor').editor.ICursorSelectionChangedEvent;
type MonacoEditorRange = import('monaco-editor').IRange;

type PrimitiveTypeName =
  | 'boolean'
  | 'number'
  | 'string'
  | 'object'
  | 'unknown'
  | 'never'
  | 'void';

export type WegasScriptEditorReturnType =
  | ScriptableInterfaceName
  | PrimitiveTypeName;

interface WegasScriptEditorProps extends EditorProps {
  returnType?: WegasScriptEditorReturnType;
}

const header = (type?: string) => {
  const cleanType = type !== undefined ? type.replace(/\r?\n/, '') : '';
  return `/*\n *\tPlease always respect the return type : ${cleanType}\n *\tPlease only write in JS even if the editor let you write in TS\n */\n() : ${cleanType} => {\n`;
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
  returnType?: WegasScriptEditorReturnType,
) => {
  if (returnType !== undefined) {
    let newValue = val;
    const lines = textToArray(newValue);
    if (lines.length > 0 && !lines[lines.length - 1].includes('return')) {
      lines[lines.length - 1] = '\treturn ' + lines[lines.length - 1];
    } else {
      lines[lines.length - 1] = lines[lines.length - 1].replace(
        /.*(return).* /,
        '\treturn ',
      );
    }
    newValue = arrayToText(lines);
    return `${header(returnType)}${newValue}${footer()}`;
  }
  return val;
};

export function WegasScriptEditor(props: WegasScriptEditorProps) {
  const { defaultValue, value, returnType } = props;
  let editorLock: ((editor: MonacoSCodeEditor) => void) | undefined = undefined;
  const editorRef = React.useRef<MonacoSCodeEditor>();
  // const [currentSelection, setSelection] = React.useState<MonacoEditorRange>();
  const selectionRef = React.useRef<MonacoEditorRange>({
    startColumn: 1,
    endColumn: 1,
    startLineNumber: headerSize,
    endLineNumber: headerSize,
  });
  const [currentValue, setCurrentValue] = React.useState<string>(
    defaultValue || value || '',
  );
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const toggleRefresh = React.useCallback(() => setRefresh(old => !old), [
    setRefresh,
  ]);

  React.useEffect(
    () =>
      setCurrentValue(oldVal => {
        const newValue = value ? value : '';
        if (deepDifferent(oldVal, newValue)) {
          return newValue;
        }
        return oldVal;
      }),
    [value, returnType],
  );

  /**
   * acceptFunctionStyle - Returning false if return type needed and function is not parsable
   * Verifies if the user didn't delete header, footer and return statement.
   * @param val - The new script value
   * @param returnType - The script return type needed
   */
  const acceptFunctionStyle = (
    val?: string,
    returnType?: WegasScriptEditorReturnType,
  ) => {
    const newVal = val ? val : '';
    if (returnType !== undefined) {
      const lines = textToArray(newVal);
      if (
        // Header protection
        arrayToText(lines.slice(0, headerSize - 1)) !==
          header(returnType).slice(0, -1) ||
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
   * trimFunctionToScript - If return type defined this function will trim the function and call back with only script value
   * @param val - The content of the editor
   * @param fn - the callback function
   */
  const trimFunctionToScript = React.useCallback(
    (val?: string, fn?: (val: string) => void) => {
      let newValue = val ? val : '';
      if (returnType !== undefined) {
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
          setCurrentValue(newValue);
          return fn && fn(newValue);
        }
        toggleRefresh();
        return;
      }
      setCurrentValue(newValue);
      return fn && fn(newValue);
    },
    [returnType, toggleRefresh],
  );

  const libContent = useStore((s: State) => {
    const variableClasses = Object.values(s.variableDescriptors).reduce<{
      [variable: string]: string;
    }>((newObject, variable) => {
      if (variable !== undefined && variable.name !== undefined) {
        newObject[variable.name] = variable['@class'];
      }
      return newObject;
    }, {});

    return ` interface GameModel{}
            declare const gameModel : GameModel;
            interface VariableClasses {${Object.keys(variableClasses).reduce(
              (s, k) => s + k + ':IS' + variableClasses[k] + ';\n',
              '',
            )}}
            class Variable {
              static find: <T extends keyof VariableClasses>(
                gameModel: GameModel,
                name: T
              ) => VariableClasses[T];
            }`;
  }, shallowDifferent);

  if (returnType !== undefined) {
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

  return (
    <SrcEditor
      key={Number(refresh)}
      {...props}
      language={'typescript'}
      extraLibs={[
        {
          content: entitiesSrc + libContent,
          name: 'VariablesTypes.d.ts',
        },
      ]}
      value={formatScriptToFunction(currentValue, returnType)}
      onEditorReady={editorLock}
      onChange={val => trimFunctionToScript(val, props.onChange)}
      onBlur={val => trimFunctionToScript(val, props.onBlur)}
      onSave={val => trimFunctionToScript(val, props.onSave)}
      defaultActions={[
        {
          id: 'SelectAllWithScriptFunction',
          label: 'Ctrl + A avoiding header and footer',
          keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_A],
          run: (_monaco, editor) => {
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
      ]}
    />
  );
}
