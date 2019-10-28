import * as React from 'react';
import SrcEditor, {
  MonacoSCodeEditor,
  textToArray,
  arrayToText,
  MonacoCodeEditor,
  MonacoEditor,
} from './SrcEditor';
import { EditorProps } from './SrcEditor';
import { useStore } from '../../../data/store';

// using raw-loader works but you need to put the whole file name and ts doesn't like it
// @ts-ignore
import entitiesSrc from '!!raw-loader!../../../../types/generated/WegasScriptableEntities.d.ts';
import { wlog } from '../../../Helper/wegaslog';
import { shallowDifferent } from '../../../data/connectStore';
import { State } from '../../../data/Reducer/reducers';

type MonacoEditorCursorEvent = import('monaco-editor').editor.ICursorSelectionChangedEvent;

type PrimitiveTypeName =
  | 'boolean'
  | 'number'
  | 'string'
  | 'object'
  | 'unknown'
  | 'never'
  | 'void';

interface WegasScriptEditorProps extends EditorProps {
  returnType?: ScriptableInterfaceName | PrimitiveTypeName;
}

const header = (type?: string) => {
  const cleanType = type !== undefined ? type.replace(/\r?\n/, '') : '';
  return `/*\n *\tPlease always respect the return type : ${cleanType}\n *\tPlease only write in JS even if the editor let you write in TS\n */\n() : ${cleanType} => {\n`;
};
const headerSize = textToArray(header()).length;
const footer = () => `\n};`;
const footerSize = textToArray(footer()).length - 1;

const cleaner = (
  val: string,
  returnType: WegasScriptEditorProps['returnType'],
) => {
  let cleanedValue = val;
  // Header cleaning
  let lines = textToArray(cleanedValue);
  if (
    arrayToText(lines.slice(0, headerSize - 1)) !==
    header(returnType).slice(0, -1)
  ) {
    cleanedValue =
      header(returnType) +
      arrayToText(lines).replace(header(returnType).slice(0, -1), '');
  }

  // Footer cleaning
  lines = textToArray(cleanedValue);
  if (lines.length > 0 && lines[lines.length - 1] !== footer().substr(1)) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(
      footer().substr(1),
      '',
    );
    cleanedValue = arrayToText(lines) + footer();
  }
  return cleanedValue;
};

const trimmer = (val: string, fn?: (val: string) => void) => {
  const newLines = textToArray(val)
    /* Removes header and footer */
    .filter(
      (_line, index, array) =>
        index >= headerSize - 1 && index < array.length - footerSize,
    );

  // Removing the last return statement (space and tabs before included)
  const lastReturnIndex = newLines.findIndex(val => val.includes('return'), -1);
  if (lastReturnIndex > -1) {
    newLines[lastReturnIndex] = newLines[lastReturnIndex].replace(
      /(\t| )*(return )/,
      '',
    );
  }
  return fn && fn(arrayToText(newLines));
};

export function WegasScriptEditor(props: WegasScriptEditorProps) {
  let editorLock: ((editor: MonacoSCodeEditor) => void) | undefined = undefined;
  let functionValue: string | undefined = undefined;
  let trimFunction = React.useCallback(
    (
      val: string,
      fn?: (val: string) => void,
      _returnType?: WegasScriptEditorProps['returnType'],
    ) => fn && fn(val),
    [],
  );
  const editorRef = React.useRef<MonacoSCodeEditor>();
  const valueRef = React.useRef<string>();

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

  if (props.returnType !== undefined) {
    trimFunction = trimmer;
    let value = props.defaultValue || props.value || '';
    const lines = textToArray(value);
    if (lines.length > 0 && !lines[lines.length - 1].includes('return')) {
      lines[lines.length - 1] = '\treturn ' + lines[lines.length - 1];
      value = arrayToText(lines);
    }
    functionValue = `${header(props.returnType)}${value}${footer()}`;

    editorLock = (editor: MonacoSCodeEditor) => {
      editorRef.current = editor;
      functionValue && onChange(functionValue);
      // Allow to make some lines of the editor readonly
      editor.onDidChangeCursorSelection((e: MonacoEditorCursorEvent) => {
        const textLines = textToArray(editor.getValue()).length;
        const trimStartUp = e.selection.startLineNumber < headerSize;
        const trimStartDown =
          e.selection.startLineNumber > textLines - footerSize;
        const trimEndUp = e.selection.endLineNumber < headerSize;
        const trimEndDown = e.selection.endLineNumber > textLines - footerSize;

        wlog(`Start onDidChangeCursorSelection event`);
        wlog(`Current limits => [${headerSize},${textLines - footerSize}]`);
        wlog(
          `Current selection => [${e.selection.startLineNumber},${e.selection.endLineNumber}]`,
        );
        wlog(
          `Selection modifiers => [[${trimStartUp},${trimStartUp}],[${trimEndUp},${trimEndDown}]]`,
        );

        if (trimStartUp || trimStartDown || trimEndUp || trimEndDown) {
          let startLine = e.selection.startLineNumber;
          let endLine = e.selection.endLineNumber;

          if (trimStartUp) {
            startLine = headerSize;
          } else if (trimStartDown) {
            startLine = textLines - footerSize;
          }

          if (trimEndUp) {
            endLine = headerSize;
          } else if (trimEndDown) {
            endLine = textLines - footerSize;
          }

          wlog(`New selection => [${startLine},${endLine}]`);

          editor.setSelection({
            ...e.selection,
            startLineNumber: startLine,
            endLineNumber: endLine,
          });

          const editorPosition = editor.getPosition();
          if (editorPosition) {
            editor.setPosition({
              column: editorPosition.column,
              lineNumber: endLine,
            });
          }
        }
        wlog(`End onDidChangeCursorSelection event\n\n`);
      });
    };
  }

  const onChange = React.useCallback(
    val => {
      // Avoiding footer or header deletion by user
      if (valueRef.current !== val && editorRef.current && props.returnType) {
        valueRef.current = cleaner(val, props.returnType);
        editorRef.current.setValue(valueRef.current);
      }
      trimFunction(
        valueRef.current ? valueRef.current : val,
        props.onChange,
        props.returnType,
      );
    },
    [trimFunction, props.onChange, props.returnType],
  );

  return (
    <SrcEditor
      {...props}
      language={'typescript'}
      extraLibs={[
        {
          content: entitiesSrc,
          name: 'ScriptableEntites.d.ts',
        },
        {
          content: libContent,
          name: 'VariablesTypes.d.ts',
        },
      ]}
      value={functionValue}
      onEditorReady={editorLock}
      onChange={onChange}
      onBlur={val => trimFunction(val, props.onBlur)}
      onSave={val => trimFunction(val, props.onSave)}
    />
  );
}
