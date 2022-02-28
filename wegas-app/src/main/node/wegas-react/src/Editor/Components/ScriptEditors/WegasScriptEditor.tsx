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
import { getLogger } from '../../../Helper/wegaslog';
import * as ts from 'typescript';
import { MessageString } from '../MessageString';
import { expandBoth, flex, flexColumn } from '../../../css/classes';
import { cx } from '@emotion/css';

const logger = getLogger('monaco');

function makeReturnTypes(returnType?: string[]) {
  return returnType?.join(' | ') || '';
}

function makeArgs(args?: [string, string[]][]): string {
  return args !== undefined ? args.map(arg => arg.join(':')).join(',') : '';
}

const header = (returnType: string = '', args: string = '') => {
  return `/* Please always respect the return type : ${returnType} */\n(${args}) : ${returnType} => {`;
};
const headerSize = textToArray(header()).length;
export const footer = () => `\n};`;
const footerSize = textToArray(footer()).length - 1;

function clearIndentation(script: string, numLevel?: number) {
  let regex: RegExp | undefined;
  if (numLevel != null) {
    if (numLevel > 0) {
      // clear up to numLevel tab
      regex = new RegExp(`^(\\t){0,${numLevel}}`, 'gm');
    }
  } else {
    // clear all tab
    regex = new RegExp('^\\t*', 'gm');
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

  if (val === '{};' || val === '{}') {
    // hack: AST will parse "{};" as en empty block + empty statement rather than an empty object;
    //       in such a case, generated code would be "{}; return;"
    //       correct code is "return {};"
    return '\treturn {};';
  }

  const sourceFile = ts.createSourceFile(
    'Testedfile',
    code,
    ts.ScriptTarget.ESNext,
    true,
  );

  if (ts.isSourceFile(sourceFile)) {
    // Find the last import before another statement
    const lastStatement =
      sourceFile.statements[sourceFile.statements.length - 1];
    if (lastStatement) {
      const p = lastStatement.getStart();
      if (!ts.isReturnStatement(lastStatement)) {
        code = code.substring(0, p) + 'return ' + code.substring(p);
      }
      return indent(code);
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
  returnType?: string,
  args?: string,
) {
  if (returnType) {
    const sourceFile = ts.createSourceFile(
      'Testedfile',
      nakedScript,
      ts.ScriptTarget.ESNext,
      true,
    );

    if (ts.isSourceFile(sourceFile)) {
      let startPosition = 0;

      // Find the last import before another statement
      for (const statement of sourceFile.statements) {
        // If new import found, push the startPosition at the end of the statement
        if (ts.isImportDeclaration(statement)) {
          startPosition = statement.end;
        }
        // If another statement is found, stop searching
        else {
          break;
        }
      }
      const imports = clearIndentation(nakedScript.substring(0, startPosition));
      const rawBody = nakedScript.substring(startPosition, nakedScript.length);
      const body = insertReturn(rawBody.replace(/^\r?\n/, ''));

      return `${imports ? imports + '\n' : ''}${header(
        returnType,
        args,
      )}\n${body}${footer()}`;
    }
  }
  return nakedScript;
}

interface Positions {
  lastImportPostion: number;
  startBodyPosition: number;
  stopBodyPosition: number;
  startReturnPosition: number;
  stopReturnPosition: number;
}

/**
 * find body and return positions.
 * return array of error if it is not possible to detect such positions
 */
function findPositions(functionalizedScript: string): Positions | string[] {
  const filePath = 'dummy.ts';

  const sourceFile = ts.createSourceFile(
    filePath,
    functionalizedScript,
    ts.ScriptTarget.ESNext,
    true,
  );

  if (ts.isSourceFile(sourceFile)) {
    const options: ts.CompilerOptions = {};
    const host: ts.CompilerHost = {
      fileExists: filePath => filePath === filePath,
      directoryExists: dirPath => dirPath === '/',
      getCurrentDirectory: () => '/',
      getDirectories: () => [],
      getCanonicalFileName: fileName => fileName,
      getNewLine: () => '\n',
      getDefaultLibFileName: () => '',
      getSourceFile: filePath =>
        filePath === filePath ? sourceFile : undefined,
      readFile: filePath =>
        filePath === filePath ? functionalizedScript : undefined,
      useCaseSensitiveFileNames: () => true,
      writeFile: () => {},
    };

    const program = ts.createProgram({
      options,
      rootNames: [filePath],
      host,
    });

    const syntaxErrors = program.getSyntacticDiagnostics();
    if (syntaxErrors.length > 0) {
      logger.log('Syntax errors: ', syntaxErrors);
      return syntaxErrors.map(se => `syntax error "${se.messageText}"`);
    }

    let lastImportPostion = 0;
    let startBodyPosition = lastImportPostion;
    let stopBodyPosition = functionalizedScript.length;
    let startReturnPosition: number | undefined = undefined;
    let stopReturnPosition: number | undefined = undefined;

    let currentStatementIndex = 0;

    // walk through leading import statements
    while (
      ts.isImportDeclaration(sourceFile.statements[currentStatementIndex])
    ) {
      // end extract last import end-position
      lastImportPostion = sourceFile.statements[currentStatementIndex].end;
      currentStatementIndex++;
    }

    const firstNonImportStatement =
      sourceFile.statements[currentStatementIndex];

    if (
      ts.isExpressionStatement(firstNonImportStatement) &&
      ts.isArrowFunction(firstNonImportStatement.expression)
    ) {
      // first non-import statement is the arrow function
      const scriptFunction = firstNonImportStatement.expression;
      if (ts.isBlock(scriptFunction.body)) {
        const body = scriptFunction.body;
        if (scriptFunction.body.statements.find(ts.isImportDeclaration)) {
          return [
            'Import statements are not allowed in the body of the function',
          ];
        } else {
          const fnStatements = body.statements;
          const firstStatement = fnStatements[0];
          if (firstStatement != null) {
            startBodyPosition = firstStatement.getFullStart();
            stopBodyPosition = body.end - 1;

            const lastStatement = fnStatements.slice(-1)[0];

            if (lastStatement == null) {
              return ['Function must have a return statement'];
            } else if (ts.isReturnStatement(lastStatement)) {
              const returnExpr = lastStatement.expression;
              if (returnExpr && ts.isObjectLiteralExpression(returnExpr)) {
                return ['Please wrap object literal within parenthesis!'];
              }

              startReturnPosition = lastStatement.getStart();
              stopReturnPosition = lastStatement.getEnd();
            } else {
              return ['Last function statement must be a return statement'];
            }
          } else {
            return ['Function is empty'];
          }
        }
      } else {
        return ['Script function must be a block'];
      }
      currentStatementIndex++;
    } else {
      // first non-import statement is not an arrow function
      if (firstNonImportStatement != null) {
        return ['Only import statements are allowed before the function'];
      } else {
        // firstNonImportStatement found
        return ['Function is missing'];
      }
    }

    if (currentStatementIndex < sourceFile.statements.length) {
      return ['Statements after the function are forbidden'];
    }

    // Find the last import before another statement
    for (const statement of sourceFile.statements) {
      // If new import found, push the startPosition at the end of the statement
      if (ts.isImportDeclaration(statement)) {
        lastImportPostion = statement.end;
      }
      // If another statement is found, stop searching
      else {
        break;
      }
    }

    if (startReturnPosition != null && stopReturnPosition != null) {
      return {
        lastImportPostion,
        startBodyPosition,
        stopBodyPosition,
        startReturnPosition,
        stopReturnPosition,
      };
    } else {
      return ['No return statement found'];
    }
  } else {
    return ['Unable to parse script'];
  }
}

function extractFromPositions(script: string, positions: Positions): string {
  const {
    lastImportPostion,
    startBodyPosition,
    //stopBodyPosition,
    startReturnPosition,
    stopReturnPosition,
  } = positions;

  const imports = script.substring(0, lastImportPostion);

  const body = script.substring(startBodyPosition, startReturnPosition);

  //Removing return keyword
  const returnStatement = script
    .substring(startReturnPosition, stopReturnPosition)
    .replace('return ', '');
  // Removing tabs in the body
  // Removing return in the last line

  return (
    imports +
    (imports ? '\n' : '') +
    clearIndentation(body.replace(/^\r?\n/, '') + returnStatement, 1)
  );
}

/**
 * FOR TESTING PURPOSE
 * May return list of errors
 */
export function defunctionalizeScript(functionalizedScript: string): string {
  const positions = findPositions(functionalizedScript);

  if (Array.isArray(positions)) {
    return positions.join('\n');
  } else {
    return extractFromPositions(functionalizedScript, positions);
  }
}

type LibMap = Record<string, string>;

const convertToLibMap = (list: MonacoDefinitionsLibrary[]) => {
  return list.reduce<LibMap>((acc, lib) => {
    acc[lib.name] = lib.content;
    return acc;
  }, {});
};

export interface WegasScriptEditorProps extends SrcEditorProps {
  scriptContext?: ScriptContext;
  returnType?: string[];
  resizable?: boolean;
  args?: [string, string[]][];
}

export function WegasScriptEditor(props: WegasScriptEditorProps) {
  const {
    returnType: returnTypeArray,
    args: argsArray,
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

  const [error, setError] = React.useState<string | undefined>();

  const returnType = makeReturnTypes(returnTypeArray);
  const args = makeArgs(argsArray);

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
      logger.info('Process ExternalModels:', content);
      acc[key] = functionalizeScript(content, returnType, args);
      logger.info('  -> Processed:', acc[key]);
      return acc;
    }, {});

    const libs: LibMap = {
      ...convertToLibMap(globalLibs),
      ...contextLibs,
      ...(functionalizedNewExtraLibs || []),
    };

    //    const currentLib = libs.find(lib => lib.name === fileName);
    //    const content = formatScriptToFunction(value || '', returnType, args);

    logger.info('Rebuild Extra libs');
    setModels(libs);
  }, [newModels, globalLibs, scriptContext, clientScripts, returnType, args]);

  logger.info('Render WSE with ', props.fileName);
  const updateLib = React.useCallback(
    (newContent: string) => {
      logger.info('New Lib:', newContent);
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
        logger.info('Should trimFunctionToScript');

        const positions = findPositions(newValue);

        if (Array.isArray(positions)) {
          // syntax error detected : print message and DO NOT trigger onChange
          setError(positions.join('\n'));
          return;
        } else {
          // return statement found
          newValue = extractFromPositions(newValue, positions);
          logger.info('Defunced to:', newValue);
        }
      }
      setError(undefined);
      // setCurrentValue(newValue);
      return fn && fn(newValue);
    },
    [returnType],
  );

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

  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      {error && <MessageString value={error} type="error" />}
      {resizable ? (
        <ResizeHandle
          minSize={100}
          textContent={models[props.fileName] + '\n\n' || '\n\n\n\n\n'}
        >
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
      )}
    </div>
  );
}
