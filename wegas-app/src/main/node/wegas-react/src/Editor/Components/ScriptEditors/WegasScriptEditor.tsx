import { Monaco } from '@monaco-editor/react';
import * as React from 'react';
import { useGlobalLibs } from '../../../Components/Hooks/useGlobalLibs';
import { librariesCTX } from '../LibrariesLoader';
import { ResizeHandle } from '../ResizeHandle';
import {
  MonacoCodeEditor,
  MonacoDefinitionsLibrary,
  MonacoEditor,
  SrcEditorAction,
  textToArray,
} from './editorHelpers';
import SrcEditor, { SrcEditorProps } from './SrcEditor';
import { wlog } from '../../../Helper/wegaslog';
import {
  createSourceFile,
  isArrowFunction,
  isBlock,
  isExpressionStatement,
  isImportDeclaration,
  isReturnStatement,
  isSourceFile,
  ScriptTarget,
} from 'typescript';

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
  return `/* Please always respect the return type : ${cleanReturnType} */\n(${cleanArgs}) : ${cleanReturnType} => {`;
};
const headerSize = textToArray(header()).length;
export const footer = () => `\n};`;
const footerSize = textToArray(footer()).length - 1;

function clearIndentation(script: string, numLevel?: number) {
  let regex: RegExp | undefined;
  if (numLevel != null) {
    if (numLevel > 0) {
      // clear up to numLevel tab
      regex = new RegExp(`^(\\t){0, ${numLevel}}`, 'g');
    }
  } else {
    // clear all tab
    regex = new RegExp('^\\t*', 'g');
  }
  if (regex) {
    return script.replaceAll(regex, '');
  }
  return script;
}

function indent(script: string, numLevel?: number) {
  const t = '\t'.repeat(numLevel || 1);
  return t + script.replaceAll(/(\r?\n)/g, '$1' + t);
}

export const insertReturn = (val: string) => {
  let code = val;

  const sourceFile = createSourceFile(
    'Testedfile',
    code,
    ScriptTarget.ESNext,
    true,
  );

  if (isSourceFile(sourceFile)) {
    // Find the last import before another statement
    const lastStatement =
      sourceFile.statements[sourceFile.statements.length - 1];
    if (lastStatement) {
      const p = lastStatement.pos;
      const statement = code.substring(p);
      if (!isReturnStatement(lastStatement)) {
        if (statement.startsWith('\r\n') || statement.startsWith('  ')) {
          code = code.substring(0, p + 2) + 'return ' + code.substring(p + 2);
        } else if (
          statement.startsWith('\r') ||
          statement.startsWith('\n') ||
          statement.startsWith(' ')
        ) {
          code = code.substring(0, p + 1) + 'return ' + code.substring(p + 1);
        } else {
          code = code.substring(0, p) + 'return ' + code.substring(p);
        }
      }
      return indent(code);
    } else {
      if (code.includes('return')) {
        return code;
      } else {
        return indent('return ' + code);
      }
    }
  }
  return val;
};

/**
 * formatScriptToFunction - if the return type is defined, return the script wrapped in a function
 * @param val - The script value
 * @param returnType - The return type of the script
 */
export function functionalizeScript(
  nakedScript: string,
  returnType?: WegasScriptEditorReturnTypeName[],
  args?: [string, WegasScriptEditorReturnTypeName[]][],
) {
  if (returnType !== undefined && returnType.length > 0) {
    const sourceFile = createSourceFile(
      'Testedfile',
      nakedScript,
      ScriptTarget.ESNext,
      true,
    );

    if (isSourceFile(sourceFile)) {
      let startPosition = 0;

      // Find the last import before another statement
      for (const statement of sourceFile.statements) {
        // If new import found, push the startPosition at the end of the statement
        if (isImportDeclaration(statement)) {
          startPosition = statement.end;
        }
        // If another statement is found, stop searching
        else {
          break;
        }
      }
      const imports = clearIndentation(nakedScript.substring(0, startPosition));
      const body = insertReturn(
        nakedScript.substring(startPosition, nakedScript.length).trim(),
      );

      return `${imports}\n${header(returnType, args)}\n${body}${footer()}`;
    }
  }
  return nakedScript;
}

export function defunctionalizeScript(functionalizedScript: string): string {
  const sourceFile = createSourceFile(
    'Testedfile',
    functionalizedScript,
    ScriptTarget.ESNext,
    true,
  );

  if (isSourceFile(sourceFile)) {
    let lastImportPostion = 0;
    // Find the last import before another statement
    for (const statement of sourceFile.statements) {
      // If new import found, push the startPosition at the end of the statement
      if (isImportDeclaration(statement)) {
        lastImportPostion = statement.end;
      }
      // If another statement is found, stop searching
      else {
        break;
      }
    }

    let startBodyPosition = lastImportPostion;
    let stopBodyPosition = functionalizedScript.length;
    let startReturnPosition: number | undefined = undefined;
    let stopReturnPosition: number | undefined = undefined;
    //Find the start and stop of the body
    for (const fileStatement of sourceFile.statements) {
      // If new import found, push the startPosition at the end of the statement
      if (
        isExpressionStatement(fileStatement) &&
        isArrowFunction(fileStatement.expression) &&
        isBlock(fileStatement.expression.body)
      ) {
        startBodyPosition = fileStatement.expression.body.getStart();
        stopBodyPosition = fileStatement.expression.body.end - 1;

        for (const functionStatement of fileStatement.expression.body
          .statements) {
          if (isReturnStatement(functionStatement)) {
            startReturnPosition = functionStatement.getStart();
            stopReturnPosition = fileStatement.expression.body.end - 1;
          }
        }
      }
    }

    const imports = functionalizedScript.substring(0, lastImportPostion);

    if (startReturnPosition != null && stopReturnPosition != null) {
      let body = functionalizedScript.substring(
        startBodyPosition,
        startReturnPosition,
      );
      if (body.startsWith('{')) {
        body = body.substring(1);
      }

      //Removing return keyword
      const returnStatement = functionalizedScript
        .substring(startReturnPosition, stopReturnPosition)
        .replace('return ', '');
      // Removing tabs in the body
      // Removing return in the last line

      return (
        imports +
        (imports ? '\n' : '') +
        clearIndentation((body + returnStatement).trim(), 1)
      );
    } else {
      let body = functionalizedScript.substring(
        startBodyPosition,
        stopBodyPosition,
      );
      if (body.startsWith('{')) {
        body = body.substring(1);
      }

      return imports + (imports ? '\n' : '') + clearIndentation(body.trim(), 1);
    }
  } else {
    return functionalizedScript;
  }
}

type LibMap = Record<string, string>;

const convertToLibMap = (list: MonacoDefinitionsLibrary[]) => {
  return list.reduce<LibMap>((acc, lib) => {
    acc[lib.name] = lib.content;
    return acc;
  }, {});
};

export function WegasScriptEditor(props: WegasScriptEditorProps) {
  const {
    returnType,
    args,
    scriptContext = 'Client',
    onChange,
    onBlur,
    onSave,
    resizable,
    models: newModels,
    defaultActions,
  } = props;
  const language = props.language ? props.language : 'typescript';
  //let editorLock: ((editor: MonacoSCodeEditor) => void) | undefined = undefined;
  //  const editorRef = React.useRef<MonacoSCodeEditor>();
  //  const selectionRef = React.useRef<MonacoEditorSimpleRange>({
  //    startColumn: 1,
  //    endColumn: 1,
  //    startLineNumber: headerSize,
  //    endLineNumber: headerSize,
  //  });

  const globalLibs = useGlobalLibs(scriptContext);
  const { clientScripts } = React.useContext(librariesCTX);

  const [models, setModels] = React.useState<LibMap>(
    convertToLibMap(globalLibs),
  );

  React.useEffect(() => {
    // make sure all clientscripts are injected as extraLibs
    // to have autocompletion
    const contextLibs =
      scriptContext === 'Client'
        ? Object.entries(clientScripts).reduce<LibMap>((acc, [k, v]) => {
            acc[`file:///${k}.ts`] = v.content;
            return acc;
          }, {})
        : {};

    const functionalizedNewExtraLibs = Object.entries(
      newModels || {},
    ).reduce<LibMap>((acc, [key, content]) => {
      wlog('Process ExternalModels:', content);
      acc[key] = functionalizeScript(content, returnType, args);
      wlog('  -> Processed:', acc[key]);
      return acc;
    }, {});

    const libs: LibMap = {
      ...convertToLibMap(globalLibs),
      ...contextLibs,
      ...(functionalizedNewExtraLibs || []),
    };

    //    const currentLib = libs.find(lib => lib.name === fileName);
    //    const content = formatScriptToFunction(value || '', returnType, args);

    wlog('Rebuild Extra libs');
    setModels(libs);
  }, [newModels, globalLibs, scriptContext, clientScripts, returnType, args]);

  wlog('Render WSE with ', props.fileName);
  const updateLib = React.useCallback(
    (newContent: string) => {
      wlog('New Lib:', newContent);
      setModels(currentLibs => {
        const updatedModels = { ...currentLibs };
        updatedModels[props.fileName] = newContent;
        return updatedModels;
      });
    },
    [props.fileName],
  );

  /**
   * trimFunctionToScript - If return type defined this function will trim the header, footer and return statement of the function and call back with only script value
   * @param val - The content of the editor
   * @param fn - the callback function
   */
  const trimFunctionToScript = React.useCallback(
    (val?: string, fn?: (val: string) => void) => {
      let newValue = val ? val : '';
      if (returnType !== undefined && returnType.length > 0) {
        wlog('Should trimFunctionToScript');
        newValue = defunctionalizeScript(newValue);
        wlog('Defunced to:', newValue);
      }
      // setCurrentValue(newValue);
      return fn && fn(newValue);
    },
    [returnType],
  );

  //  if (returnType !== undefined && returnType.length > 0) {
  //    editorLock = (editor: MonacoSCodeEditor) => {
  //      editorRef.current = editor;
  //      // Allow to make lines of the editor readonly
  //      editor.onDidChangeCursorSelection((e: MonacoEditorCursorEvent) => {
  //        if (deepDifferent(selectionRef.current, e.selection)) {
  //          const textLines = textToArray(editor.getValue()).length;
  //          const trimStartUp = e.selection.startLineNumber < headerSize;
  //          const trimStartDown =
  //            e.selection.startLineNumber > textLines - footerSize;
  //          const trimEndUp = e.selection.endLineNumber < headerSize;
  //          const trimEndDown =
  //            e.selection.endLineNumber > textLines - footerSize;
  //
  //          if (trimStartUp || trimStartDown || trimEndUp || trimEndDown) {
  //            editor.setSelection(selectionRef.current);
  //          } else {
  //            selectionRef.current = e.selection;
  //          }
  //        }
  //      });
  //    };
  //  }

  const actions = React.useCallback(
    (monaco: Monaco): SrcEditorAction[] => [
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
    ],
    [defaultActions, returnType],
  );

  const handleChange = React.useCallback(
    val => {
      updateLib(val);
      return trimFunctionToScript(val, onChange);
    },
    [onChange, trimFunctionToScript, updateLib],
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

  const content = functionalizeScript('', returnType, args);

  return resizable ? (
    <ResizeHandle minSize={100} textContent={content}>
      <SrcEditor
        {...props}
        language={language}
        models={models}
        //        onEditorReady={ editorLock }
        onChange={handleChange}
        onBlur={handleBlur}
        onSave={handleSave}
        defaultActions={actions}
      />
    </ResizeHandle>
  ) : (
    <SrcEditor
      {...props}
      language={language}
      models={models}
      //      onEditorReady={ editorLock }
      onChange={handleChange}
      onBlur={handleBlur}
      onSave={handleSave}
      defaultActions={actions}
    />
  );
}
