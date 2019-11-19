import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import {
  DiffEditor,
  Monaco,
  DiffEditorDidMount,
  monaco,
} from '@monaco-editor/react';
import { MonacoEditorProperties, gutter, addExtraLib } from './SrcEditor';
import schemas from '../../../page-schema.build';

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

type MonacoSDiffEditor = Parameters<DiffEditorDidMount>[2];
type MonacoDiffNavigator = ReturnType<Monaco['editor']['createDiffNavigator']>;
export type DiffEditorLineChanges = Exclude<
  ReturnType<MonacoSDiffEditor['getLineChanges']>,
  null
>;

/**
 * ExtendedDiffNavigator is an interface that exposes two more attributes than the standard IDiffNavigator
 */
export interface ExtendedDiffNavigator extends MonacoDiffNavigator {
  /**
   * _editor - the current diff editor
   */
  _editor: MonacoSDiffEditor;
  /**
   * nextIdx - the index of the focused diff
   */
  nextIdx: number;
}

interface WegasDiffEditorProps {
  /**
   * originalValue - the original content.
   * Located on the left side of the editor.
   * Is readonly for user.
   */
  originalValue: string;
  /**
   * modifiedValue - the modified content.
   * Located on the right side of the editor
   */
  modifiedValue: string;
  /**
   * minimap - the editor shows a minimap of the code
   */
  minimap?: boolean;
  /**
   * readonly - the editor is not listening to keys
   */
  readOnly?: boolean;
  /**
   * langauge - the editor language
   */
  language?: 'javascript' | 'plaintext' | 'css' | 'json' | 'typescript';
  /**
   * idx - the index of the diff to be focused
   */
  idx?: number;
  /**
   * handleDiffNavigator - this function gets the diffNavigator that allows navigation between diffs
   */
  handleDiffNavigator?: (diffNavigator: MonacoDiffNavigator) => void;
  /**
   * onDiffChange - this function is fired each time diffs change
   */
  onDiffChange?: (diffs: DiffEditorLineChanges) => void;
  /**
   * onModifiedChange - this function is fired each time the user type something in the modified editor
   */
  onModifiedChange?: (value: string) => void;
  /**
   * onBlur - this function is fired each time the modifiedEditor loose focus
   */
  onModifiedBlur?: (value: string) => void;
  /**
   * onSave - this function is fired each time the user press Ctrl+S
   */
  onSave?: (value: string) => void;
  /**
   * onEditorReady - Callback to give the editor the a higher component
   */
  onEditorReady?: (editor: MonacoSDiffEditor) => void;
  /**
   * defaultUri - allows the language to be inferred from this uri
   * To apply changes you must rerender the whole editor (i.e : change the key of the componnent)
   */
  defaultUri?: 'internal://page.json';
  /**
   * defaultProperties - Add specific properties for monaco-editor
   */
  defaultProperties?: MonacoEditorProperties;
  /**
   * noGutter - If true, completely hides the left margin (line numbers and symbols)
   */
  noGutter?: boolean;
  /**
   * extraLibs - libraries to add to the editor intellisense
   */
  extraLibs?: { content: string; name?: string }[];
}

function WegasDiffEditor({
  defaultUri,
  originalValue,
  modifiedValue,
  language,
  readOnly,
  minimap,
  noGutter,
  defaultProperties,
  extraLibs,
  onEditorReady,
  onDiffChange,
  onModifiedChange,
  onModifiedBlur,
  onSave,
  handleDiffNavigator,
  idx,
}: WegasDiffEditorProps) {
  const [editor, setEditor] = React.useState<MonacoSDiffEditor>();
  const [navigator, setNavigator] = React.useState<ExtendedDiffNavigator>();
  const [reactMonaco, setReactMonaco] = React.useState<Monaco>();
  const getOriginalValue = React.useRef<() => string>();
  const getModifiedValue = React.useRef<() => string>();

  monaco.init().then(setReactMonaco);

  React.useEffect(
    () => {
      if (reactMonaco) {
        if (editor) {
          // Creates 2 models for original and modified content
          const originalModel = reactMonaco.editor.createModel(
            originalValue || '',
            language || 'plaintext',
            defaultUri ? reactMonaco.Uri.parse(defaultUri) : undefined,
          );
          const modifiedModel = reactMonaco.editor.createModel(
            modifiedValue || '',
            language || 'plaintext',
            defaultUri ? reactMonaco.Uri.parse(defaultUri) : undefined,
          );
          editor.setModel({
            original: originalModel,
            modified: modifiedModel,
          });

          // Creates a diff navigator to allow navigation in diffs
          setNavigator(
            reactMonaco.editor.createDiffNavigator(editor, {
              ignoreCharChanges: true,
            }) as ExtendedDiffNavigator,
          );

          return () => {
            if (editor) {
              const originalEditor = editor.getOriginalEditor();
              const modifiedEditor = editor.getModifiedEditor();
              const originalModel = originalEditor.getModel();
              const modifiedModel = modifiedEditor.getModel();
              if (originalModel) {
                originalModel.dispose();
              }
              if (modifiedModel) {
                modifiedModel.dispose();
              }
              originalEditor.dispose();
              modifiedEditor.dispose();
              editor.dispose();
            }
          };
        }
      }
    } /* eslint-disable react-hooks/exhaustive-deps */ /* Linter disabled for the following lines to avoid reloading editor and loosing focus */,
    [
      editor,
      reactMonaco,
      // defaultUri,
      // originalValue,
      // modifiedValue,
      // language,
    ],
  );
  /* eslint-enable */

  React.useEffect(() => {
    // Fires the handleDiffNavigator to pass the navigator to the parent component
    if (handleDiffNavigator && navigator) {
      handleDiffNavigator(navigator);
    }
    return () => {
      if (navigator) {
        navigator.dispose();
      }
    };
  }, [handleDiffNavigator, navigator]);

  React.useEffect(() => {
    if (idx && navigator) {
      const firstIdx = navigator.nextIdx;
      while (navigator.nextIdx !== idx && navigator.nextIdx !== firstIdx) {
        navigator.next();
      }
      if (navigator.nextIdx === idx) {
        navigator.next();
      }
    }
  }, [navigator, idx]);

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
              fileMatch: ['page.json'],
              uri: 'internal://page-schema.json',
              schema: (schemas as any).schema,
            },
          ],
        });
      }
    }
  }, [extraLibs, language, reactMonaco]);

  React.useEffect(() => {
    if (reactMonaco) {
      if (editor) {
        if (onEditorReady) {
          onEditorReady(editor);
        }

        editor.getModifiedEditor().onDidBlurEditorText(() => {
          if (onModifiedBlur && getModifiedValue.current) {
            onModifiedBlur(getModifiedValue.current());
          }
        });

        editor.getModifiedEditor().onDidChangeModelContent(() => {
          if (onModifiedChange && getModifiedValue.current) {
            onModifiedChange(getModifiedValue.current());
          }
        });

        editor.onDidUpdateDiff(() => {
          if (onDiffChange) {
            const diffs = editor.getLineChanges();
            onDiffChange(diffs ? diffs : []);
          }
        });
      }
    }
  }, [
    editor,
    onEditorReady,
    reactMonaco,
    onModifiedBlur,
    onModifiedChange,
    onDiffChange,
  ]);

  React.useEffect(() => {
    if (reactMonaco) {
      if (editor) {
        editor.addAction({
          id: 'onSave',
          label: 'Save code',
          keybindings: [reactMonaco.KeyMod.CtrlCmd | reactMonaco.KeyCode.KEY_S],
          run: () => {
            if (onSave && getOriginalValue.current) {
              onSave(getOriginalValue.current());
            }
          },
        });
      }
    }
  }, [editor, onSave, reactMonaco]);

  function handleEditorDidMount(
    getOriginal: () => string,
    getModified: () => string,
    editor: MonacoSDiffEditor,
  ) {
    getOriginalValue.current = getOriginal;
    getModifiedValue.current = getModified;
    setEditor(editor);
  }

  return (
    <SizedDiv className={overflowHide}>
      {size => (
        <DiffEditor
          height={size ? size.height : undefined} // By default, it fully fits with its parent
          width={size ? size.width : undefined} // By default, it fully fits with its parent
          theme={'dark'}
          language={language}
          original={originalValue}
          modified={modifiedValue}
          editorDidMount={handleEditorDidMount}
          loading={'Loading...'}
          options={{
            readOnly,
            minimap: { enabled: minimap },
            ...gutter(noGutter),
            ...defaultProperties,
          }}
        />
      )}
    </SizedDiv>
  );
}

export default WegasDiffEditor;
