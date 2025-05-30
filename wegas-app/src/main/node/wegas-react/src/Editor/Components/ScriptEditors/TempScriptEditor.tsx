import { css, cx } from '@emotion/css';
import { Monaco } from '@monaco-editor/react';
import * as React from 'react';
import * as ts from 'typescript';
import { useTempModel } from '../../../Components/Contexts/LibrariesContext';
import { insertReturn } from '../../../Components/Hooks/useScript';
import { expandBoth, flex, flexColumn } from '../../../css/classes';
import { getLogger } from '../../../Helper/wegaslog';
import { MessageString } from '../MessageString';
import { ResizeHandle } from '../ResizeHandle';
import { SrcEditorAction, SrcEditorLanguages } from './editorHelpers';
import SrcEditor, { SrcEditorProps } from './SrcEditor';

const logger = getLogger('monaco');

export function makeReturnTypes(returnType?: string[]) {
  return returnType?.join(' | ') || '';
}

function makeArgs(args?: [string, string[]][]): string {
  return args !== undefined ? args.map(arg => arg.join(':')).join(',') : '';
}

const header = (returnType: string = '', args: string = '') => {
  return `/* Please always respect the return type : ${returnType} */\n(${args}) : ${returnType} => {`;
};
export const footer = () => `\n};`;

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
    return script.replace(regex, '');
  }
  return script;
}

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

// type LibMap = Record<string, string>;

// const convertToLibMap = (list: MonacoDefinitionsLibrary[]) => {
//   return list.reduce<LibMap>((acc, lib) => {
//     acc[lib.name] = lib.content;
//     return acc;
//   }, {});
// };

export interface TempScriptEditorProps
  extends Omit<SrcEditorProps, 'filename'> {
  initialValue?: string;
  language?: SrcEditorLanguages;
  returnType?: string[];
  resizable?: boolean;
  args?: [string, string[]][];
  /**
   * onChange - this function is fired each time the content of the editor is changed by the user
   */
  onChange?: (value: string) => void;
}

export function TempScriptEditor(props: TempScriptEditorProps) {
  const {
    initialValue,
    language = 'plaintext',
    returnType: returnTypeArray,
    args: argsArray,
    onChange,
    onBlur,
    onSave,
    resizable,
    defaultActions,
  } = props;

  const [value, setValue] = React.useState(initialValue);
  const refValue = React.useRef(initialValue);
  const [error, setError] = React.useState<string | undefined>();
  const returnType = makeReturnTypes(returnTypeArray);
  const args = makeArgs(argsArray);
  const srcModel = useTempModel(
    functionalizeScript(initialValue || '', returnType, args),
    language,
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
      if (refValue.current !== newValue) {
        refValue.current = newValue;
        fn && fn(newValue);
      }
    },
    [returnType],
  );

  const actions = React.useCallback(
    (monaco: Monaco): SrcEditorAction[] => {
      return [...(defaultActions ? defaultActions(monaco) : [])];
    },
    [defaultActions],
  );

  const handleChange = React.useCallback(() => {
    if (srcModel != null) {
      setValue(srcModel.getValue());
      trimFunctionToScript(srcModel.getValue(), onChange);
    }
  }, [onChange, srcModel, trimFunctionToScript]);

  React.useEffect(() => {
    srcModel?.onDidChangeContent(handleChange);
  }, [handleChange, srcModel]);

  const handleBlur = React.useCallback(
    (val: string | undefined) => {
      trimFunctionToScript(val, onBlur);
    },
    [onBlur, trimFunctionToScript],
  );

  const handleSave = React.useCallback(
    (val: string | undefined) => trimFunctionToScript(val, onSave),
    [onSave, trimFunctionToScript],
  );

  return (
    <div
      className={cx(flex, flexColumn, expandBoth, css({ minWidth: '500px' }))}
    >
      {error && <MessageString value={error} type="error" />}
      {resizable ? (
        <ResizeHandle
          minSize={125}
          textContent={value + '\n\n' || '\n\n\n\n\n'}
        >
          <SrcEditor
            {...props}
            fileName={srcModel?.uri.toString()}
            onBlur={handleBlur}
            onSave={handleSave}
            defaultActions={actions}
          />
        </ResizeHandle>
      ) : (
        <SrcEditor
          {...props}
          fileName={srcModel?.uri.toString()}
          onBlur={handleBlur}
          onSave={handleSave}
          defaultActions={actions}
        />
      )}
    </div>
  );
}
