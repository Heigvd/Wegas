import * as React from 'react';
import SrcEditor, {
  MonacoSCodeEditor,
  textToArray,
  arrayToText,
  MonacoEditor,
  MonacoCodeEditor,
  SrcEditorAction,
  MonacoEditorCursorEvent,
  MonacoEditorSimpleRange,
} from './SrcEditor';
import { SrcEditorProps } from './SrcEditor';
import { useStore } from '../../../data/store';
import { deepDifferent, refDifferent } from '../../../data/connectStore';
import { State } from '../../../data/Reducer/reducers';
import { GameModel } from '../../../data/selectors';
import { WegasScriptEditorReturnTypeName } from '../../../Components/Hooks/types/scriptMethodGlobals';
import { useMonacoEditor } from '../../../Components/Hooks/useMonacoEditor';
import { classesCtx } from '../../../Components/ClassesContext';

// using raw-loader works but you need to put the whole file name and ts doesn't like it
// @ts-ignore
import entitiesSrc from '!!raw-loader!../../../../types/generated/WegasScriptableEntities.d.ts';
// @ts-ignore
import editorGlobalSrc from '!!raw-loader!../../../Components/Hooks/types/scriptEditorGlobals.ts';
// @ts-ignore
import methodGlobalSrc from '!!raw-loader!../../../Components/Hooks/types/scriptMethodGlobals.ts';
// @ts-ignore
import schemaGlobalSrc from '!!raw-loader!../../../Components/Hooks/types/scriptSchemaGlobals.ts';
// @ts-ignore
import classesGlobalSrc from '!!raw-loader!../../../Components/Hooks/types/scriptClassesGlobals.ts';

export interface WegasScriptEditorProps extends SrcEditorProps {
  clientScript?: boolean;
  returnType?: WegasScriptEditorReturnTypeName;
}

const header = (type?: string) => {
  const cleanType = type !== undefined ? type.replace(/\r?\n/, '') : '';
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
  returnType?: WegasScriptEditorReturnTypeName,
) => {
  if (returnType !== undefined) {
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

const cleanLib = (libSrc: string) => libSrc.replace(/^(export )/gm, '');

export function WegasScriptEditor(props: WegasScriptEditorProps) {
  const { defaultValue, value, returnType, clientScript } = props;
  let editorLock: ((editor: MonacoSCodeEditor) => void) | undefined = undefined;
  const editorRef = React.useRef<MonacoSCodeEditor>();
  const selectionRef = React.useRef<MonacoEditorSimpleRange>({
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
  const { classes } = React.useContext(classesCtx);
  const monaco = useMonacoEditor();

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
    returnType?: WegasScriptEditorReturnTypeName,
  ) => {
    const newVal = val ? val : '';
    if (returnType !== undefined) {
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
        // If the user deleted the function's header, footer or return statement, the value is rolled back
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

    const globalMethods = s.global.methods;
    const globalSchemas = s.global.schemas.views;

    const currentLanguages = Object.values(
      GameModel.selectCurrent().languages,
    ).reduce((lt, l) => `${lt} | '${l.code}'`, '');

    return `
    declare const gameModel : ISGameModel;
    declare const self : ISPlayer;
    declare const typeFactory: (types: WegasScriptEditorReturnTypeName[]) => GlobalMethodReturnTypesName;
  
    interface VariableClasses {${Object.keys(variableClasses).reduce(
      (s, k) => s + k + ':IS' + variableClasses[k] + ';\n',
      '',
    )}}
    class Variable {
      static find: <T extends keyof VariableClasses>(
        gameModel: ISGameModel,
        name: T
      ) => VariableClasses[T];
    }

    type CurrentLanguages = ${currentLanguages};
    interface EditorClass extends GlobalEditorClass {
      setLanguage: (lang: { code: ISGameModelLanguage['code'] } | CurrentLanguages) => void;
    }
    declare const Editor: EditorClass;

    interface GlobalMethods {\n${Object.keys(globalMethods).reduce((s, k) => {
      const method = globalMethods[k];
      const isArray = method.array === 'array';
      {
        isArray ? ' (' : ' ';
      }
      {
        method.types.reduce((s, t, i) => s + (i > 0 ? ' | ' : '') + t, '');
      }
      {
        isArray ? ')[]' : '';
      }
      return (
        s +
        `'${k}' : () => ${isArray ? ' (' : ' '} ${method.types.reduce(
          (s, t, i) => s + (i > 0 ? ' | ' : '') + t,
          '',
        )} ${isArray ? ')[]' : ''};\n`
      );
    }, '')}}
    interface MethodClass ${clientScript ? 'extends GlobalMethodClass ' : ''}{
      getMethod: <T extends keyof GlobalMethods>(name : T) => GlobalMethods[T];
    }
    declare const Methods : MethodClass

    type GlobalSchemas = ${Object.keys(globalSchemas).reduce(
      (s, k) => s + `\n  | '${k}'`,
      '',
    )}}
    interface SchemaClass ${clientScript ? 'extends GlobalSchemaClass ' : ''}{
      removeSchema: (name: GlobalSchemas) => void;
    }
    declare const Schemas : SchemaClass
    
    type GlobalClasses = ${
      classes.length === 0
        ? 'never'
        : classes.reduce((oc, c) => oc + `\n  | '${c}'`, '')
    }}
    interface ClassesClass extends GlobalClassesClass{
      removeClass: (className: GlobalClasses) => void;
    }
    declare const Classes : ClassesClass

    `;
  }, refDifferent);

  // wlog(libContent);

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

  const actions: SrcEditorAction[] =
    returnType && monaco
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

  return (
    <SrcEditor
      key={Number(refresh)}
      {...props}
      defaultLanguage={'typescript'}
      extraLibs={[
        {
          content: `${entitiesSrc}\n
          ${cleanLib(editorGlobalSrc)}\n
          ${cleanLib(methodGlobalSrc)}\n
          ${cleanLib(schemaGlobalSrc)}\n
          ${cleanLib(classesGlobalSrc)}\n
          ${libContent}\n`,
          name: 'VariablesTypes.d.ts',
        },
      ]}
      value={formatScriptToFunction(currentValue, returnType)}
      onEditorReady={editorLock}
      onChange={val => trimFunctionToScript(val, props.onChange)}
      onBlur={val => trimFunctionToScript(val, props.onBlur)}
      onSave={val => trimFunctionToScript(val, props.onSave)}
      defaultActions={actions}
    />
  );
}
