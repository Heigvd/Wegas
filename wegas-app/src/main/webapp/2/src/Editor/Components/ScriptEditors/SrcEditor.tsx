import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import Editor, {
  Monaco,
  monaco,
  EditorProps,
  DiffEditorDidMount,
  EditorDidMount,
} from '@monaco-editor/react';
import schemas from '../../../page-schema.build';
import { wlog } from '../../../Helper/wegaslog';

export type SrcEditorLanguages =
  | 'javascript'
  | 'plaintext'
  | 'css'
  | 'json'
  | 'typescript';
export type MonacoEditor = Monaco;
export type MonacoEditorProperties = Exclude<EditorProps['options'], undefined>;
export type MonacoLangaugesServices = MonacoEditor['languages']['typescript']['typescriptDefaults'];
export type MonacoSCodeEditor = Parameters<EditorDidMount>[1];
export type MonacoSDiffEditor = Parameters<DiffEditorDidMount>[2];
export type MonacoCodeEditor = Parameters<
  Parameters<MonacoSCodeEditor['addAction']>[0]['run']
>[0];
export type MonacoEditorCursorEvent = Parameters<
  Parameters<MonacoCodeEditor['onDidChangeCursorSelection']>[0]
>[0];
export type MonacoEditorModel = Exclude<
  ReturnType<MonacoSCodeEditor['getModel']>,
  null
>;
export interface MonacoEditorSimpleToken {
  offset: number;
  type: string;
  language: string;
}
export interface MonacoDefinitionsLibraries {
  content: string;
  name?: string;
}
export interface MonacoEditorSimpleRange {
  /**
   * Line number on which the range starts (starts at 1).
   */
  startLineNumber: number;
  /**
   * Column on which the range starts in line `startLineNumber` (starts at 1).
   */
  startColumn: number;
  /**
   * Line number on which the range ends.
   */
  endLineNumber: number;
  /**
   * Column on which the range ends in line `endLineNumber`.
   */
  endColumn: number;
}

export interface SrcEditorAction {
  /**
   * id - An unique identifier of the contributed action.
   */
  id: string;
  /**
   * label - A label of the action that will be presented to the user.
   */
  label: string;
  /**
   * keys - An optional array of keybindings for the action.
   */
  keybindings?: number[];
  /**
   * run - the function to be fired with the action
   */
  run: (monaco: MonacoEditor, editor: MonacoCodeEditor) => void;
}

export interface SrcEditorProps {
  /**
   * value - the content of the editor
   */
  value?: string;
  /**
   * minimap - the editor shows a minimap of the code
   */
  minimap?: boolean;
  /**
   * noGutter - If true, completely hides the left margin (line numbers and symbols)
   */
  noGutter?: boolean;
  /**
   * readonly - the editor is not listening to keys
   */
  readOnly?: boolean;
  /**
   * language - the editor language
   */
  language?: SrcEditorLanguages;
  /**
   * cursorOffset - the position of the cursor in the text
   */
  cursorOffset?: number;

  /**
   * onChange - this function is fired each time the content of the editor is changed by the user
   */
  onChange?: (value: string) => void;
  /**
   * onBlur - this function is fired each time the editor loose focus
   */
  onBlur?: (value: string) => void;
  /**
   * onSave - this function is fired each time the user press Ctrl+S
   */
  onSave?: (value: string) => void;
  /**
   * defaultUri - allows the language to be inferred from this uri
   * To apply changes you must rerender the whole editor (i.e : change the key of the componnent)
   */
  defaultUri?: 'internal://page.json';
  /**
   * defaultKeyEvents - a list of key event to be caught in the editor
   */
  defaultActions?: SrcEditorAction[];
  /**
   * defaultFocus - force editor to focus on first render
   */
  defaultFocus?: boolean;
  /**
   * extraLibs - libraries to add to the editor intellisense
   */
  extraLibs?: MonacoDefinitionsLibraries[];
  /**
   * onEditorReady - Callback to give the editor the a higher component
   */
  onEditorReady?: (editor: MonacoSCodeEditor) => void;
  /**
   * defaultProperties - Add specific properties for monaco-editor
   */
  defaultProperties?: MonacoEditorProperties;
  /**
   * forceJS - If true, force the user to code in javascript, event if typescript language is defined.
   * It allows to keep offering typescript intellisense while coding in javascript
   */
  forceJS?: boolean;
}

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

/**
 * textToArray split a text into an array of lines
 *
 * @param text - the text to be splitted
 */
export const textToArray = (text: string): string[] => text.split(/\r?\n/);

/**
 * arrayToText merge an array of lines into a single string
 *
 * @param lines - the array of lines
 */
export const arrayToText = (lines: string[]): string =>
  lines.reduce((newString, line) => newString + line + '\n', '').slice(0, -1);

export const addExtraLib = (
  service: MonacoLangaugesServices,
  extraLibs?: SrcEditorProps['extraLibs'],
) => {
  if (extraLibs) {
    for (const lib of extraLibs) {
      service.addExtraLib(lib.content, lib.name);
    }
  }
};

export const gutter: (
  noGutter?: boolean,
) => Pick<MonacoEditorProperties, 'lineNumbers' | 'glyphMargin' | 'folding'> = (
  noGutter?: boolean,
) => {
  if (noGutter) {
    return {
      lineNumbers: 'off',
      glyphMargin: false,
      folding: false,
    };
  }
  return {};
};

/**
 * SrcEditor is a component uses monaco-editor to create a code edition panel
 */
function SrcEditor({
  value,
  defaultFocus,
  language,
  defaultUri,
  readOnly,
  minimap,
  cursorOffset,
  extraLibs,
  noGutter,
  defaultProperties,
  onEditorReady,
  onBlur,
  onChange,
  onSave,
  defaultActions,
  forceJS,
}: SrcEditorProps) {
  const [editor, setEditor] = React.useState<MonacoSCodeEditor>();
  const [reactMonaco, setReactMonaco] = React.useState<MonacoEditor>();
  const getValue = React.useRef<() => string>();
  const editorValue = React.useRef(value || '');

  React.useEffect(() => {
    if (!reactMonaco) {
      monaco.init().then(setReactMonaco);
    }
  }, [reactMonaco]);

  React.useEffect(
    () => {
      if (reactMonaco) {
        if (editor) {
          editor.setModel(
            reactMonaco.editor.createModel(
              value || '',
              language || 'plaintext',
              defaultUri ? reactMonaco.Uri.parse(defaultUri) : undefined,
            ),
          );

          // Unmount effect to dispose editor and model
          return () => {
            if (editor) {
              const model = editor.getModel();
              if (model) {
                model.dispose();
              }
              editor.dispose();
            }
          };
        }
      }
    } /* eslint-disable react-hooks/exhaustive-deps */ /* Linter disabled for the following lines to avoid reloading editor and loosing focus */,
    [
      editor,
      reactMonaco,
      // defaultValue,
      // language,
      // defaultUri
      // value,
    ],
  );
  /* eslint-enable */

  React.useEffect(() => {
    if (reactMonaco) {
      if (language === 'javascript') {
        reactMonaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          target: reactMonaco.languages.typescript.ScriptTarget.ES5,
          noLib: true,
          allowNonTsExtensions: true,
        });
        addExtraLib(
          reactMonaco.languages.typescript.javascriptDefaults,
          extraLibs,
        );
      } else if (language === 'typescript') {
        reactMonaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          // noLib: true, //TODO: wait for the issue / stackoverflow solution :P
          allowNonTsExtensions: true,
          checkJs: true,
          allowJs: forceJS,
          target: reactMonaco.languages.typescript.ScriptTarget.ES5,
        });
        extraLibs &&
          addExtraLib(reactMonaco.languages.typescript.typescriptDefaults, [
            ...extraLibs,
          ]);

        wlog(
          'monaco editor ts version : ' +
            reactMonaco.languages.typescript.typescriptVersion,
        );
      } else if (language === 'json') {
        reactMonaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [
            {
              fileMatch: ['page.json'],
              uri: 'internal://page-schema.json',
              schema: (schemas as any).schema,
            },
          ],
        });
      }
    }
  }, [extraLibs, language, reactMonaco, forceJS]);

  React.useEffect(() => {
    if (reactMonaco) {
      if (editor) {
        if (defaultFocus) {
          editor.focus();
        }
      }
    }
  }, [defaultFocus, editor, reactMonaco]);

  React.useEffect(() => {
    if (reactMonaco) {
      if (editor) {
        if (defaultFocus) {
          editor.focus();
        }
        if (cursorOffset) {
          const model = editor.getModel();
          if (model) {
            editor.setPosition(model.getPositionAt(cursorOffset));
          }
        }
        if (onEditorReady) {
          onEditorReady(editor);
        }

        editor.onDidBlurEditorText(() => {
          if (onBlur && getValue.current) {
            onBlur(getValue.current());
          }
        });
        editor.onDidChangeModelContent(() => {
          if (getValue.current) {
            const newVal = getValue.current();
            if (newVal !== editorValue.current) {
              editorValue.current = newVal;
              if (onChange) {
                onChange(newVal);
              }
            }
          }
        });
      }
    }
  }, [
    cursorOffset,
    defaultFocus,
    editor,
    onBlur,
    onChange,
    onEditorReady,
    reactMonaco,
  ]);

  React.useEffect(() => {
    if (reactMonaco) {
      if (editor) {
        editor.addAction({
          id: 'onSave',
          label: 'Save code',
          keybindings: [reactMonaco.KeyMod.CtrlCmd | reactMonaco.KeyCode.KEY_S],
          run: () => {
            if (onSave && getValue.current) {
              onSave(getValue.current());
            }
          },
        });
        if (defaultActions) {
          defaultActions.forEach(action => {
            editor.addAction({
              ...action,
              run: editor => action.run(reactMonaco, editor),
            });
          });
        }
      }
    }
  }, [defaultActions, editor, onSave, reactMonaco]);

  function handleEditorDidMount(
    getEditorValue: () => string,
    editor: MonacoSCodeEditor,
  ) {
    getValue.current = getEditorValue;
    setEditor(editor);
  }
  // useChronometer('SrcEditor');
  return (
    <SizedDiv className={overflowHide}>
      {size => {
        return (
          <Editor
            height={size ? size.height : undefined} // By default, it fully fits with its parent
            width={size ? size.width : undefined} // By default, it fully fits with its parent
            theme={'dark'}
            language={language}
            value={value}
            editorDidMount={handleEditorDidMount}
            loading={'Loading...'}
            options={{
              readOnly,
              minimap: { enabled: minimap },
              ...gutter(noGutter),
              ...defaultProperties,
            }}
          />
        );
      }}
    </SizedDiv>
  );
}
export default SrcEditor;
