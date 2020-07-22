import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import Editor, { monaco } from '@monaco-editor/react';
import {
  MonacoEditor,
  SrcEditorLanguages,
  MonacoDefinitionsLibraries,
  MonacoSCodeEditor,
  MonacoEditorProperties,
  MonacoLangaugesServices,
  SrcEditorAction,
} from './editorHelpers';
import { useJSONSchema } from './useJSONSchema';

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
  const mounted = React.useRef<boolean>(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  React.useEffect(() => {
    if (!reactMonaco) {
      monaco.init().then(me => {
        if (mounted.current) {
          setReactMonaco(me);
        }
      });
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

  const schema = useJSONSchema(language === 'json');

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
      } else if (language === 'json') {
        reactMonaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [
            {
              uri: 'internal://page-schema.json',
              fileMatch: ['page.json'],
              schema,
            },
          ],
        });
      }
    }
  }, [extraLibs, language, reactMonaco, forceJS, schema]);

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
