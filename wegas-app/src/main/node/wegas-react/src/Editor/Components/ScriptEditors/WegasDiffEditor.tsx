import { css } from '@emotion/css';
import { DiffEditor, Monaco } from '@monaco-editor/react';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import {
  MonacoDefinitionsLibrary,
  MonacoEditorProperties,
  MonacoSDiffEditor,
} from './editorHelpers';
import { addExtraLib, gutter, languageToFormat } from './SrcEditor';
import { useJSONSchema } from './useJSONSchema';

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

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
   * filename - the name of the current file
   */
  fileName?: string;
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
  extraLibs?: MonacoDefinitionsLibrary[];
}

function WegasDiffEditor({
  fileName,
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
  const i18nValues = useInternalTranslate(commonTranslations);
  const schema = useJSONSchema();

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

  const beforeMount = React.useCallback(
    (reactMonaco: Monaco) => {
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
              schema,
            },
          ],
        });
      }

      setReactMonaco(reactMonaco);
    },
    [extraLibs, language, schema],
  );

  const onMount = React.useCallback(
    (editor: MonacoSDiffEditor, reactMonaco: Monaco) => {
      getOriginalValue.current = editor.getOriginalEditor().getValue;
      getModifiedValue.current = editor.getModifiedEditor().getValue;
      setEditor(editor);

      // Creates 2 models for original and modified content
      const originalModel = reactMonaco.editor.createModel(
        originalValue || '',
        language || 'plaintext',
        reactMonaco.Uri.parse(
          `file:///${
            fileName || String(new Date().getTime())
          }.${languageToFormat(language)}`,
        ),
      );
      const modifiedModel = reactMonaco.editor.createModel(
        modifiedValue || '',
        language || 'plaintext',
        reactMonaco.Uri.parse(
          `file:///${
            fileName || String(new Date().getTime())
          }_modified.${languageToFormat(language)}`,
        ),
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

      if (onEditorReady) {
        onEditorReady(editor);
      }
    },
    [language, modifiedValue, onEditorReady, originalValue],
  );

  React.useEffect(() => {
    if (reactMonaco != null) {
      if (language === 'typescript') {
        reactMonaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          allowNonTsExtensions: true,
          checkJs: true,
          target: reactMonaco.languages.typescript.ScriptTarget.ESNext,
        });
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
  }, [extraLibs, language, reactMonaco, schema]);

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      extraLibs?.forEach(lib => {
        reactMonaco.editor.createModel(
          lib.content,
          'typescript',
          reactMonaco.Uri.parse(lib.name),
        );
      });
    }
  }, [editor, extraLibs, reactMonaco]);

  React.useEffect(() => {
    if (editor != null) {
      editor.getModifiedEditor().onDidBlurEditorText(() => {
        if (onModifiedBlur && getModifiedValue.current) {
          onModifiedBlur(getModifiedValue.current());
        }
      });
    }
  }, [editor, onModifiedBlur]);

  React.useEffect(() => {
    if (editor != null) {
      editor.getModifiedEditor().onDidChangeModelContent(() => {
        if (onModifiedChange && getModifiedValue.current) {
          onModifiedChange(getModifiedValue.current());
        }
      });
    }
  }, [editor, onModifiedBlur, onModifiedChange]);

  React.useEffect(() => {
    if (editor != null) {
      editor.onDidUpdateDiff(() => {
        if (onDiffChange) {
          const diffs = editor.getLineChanges();
          onDiffChange(diffs ? diffs : []);
        }
      });
    }
  }, [editor, onDiffChange, onModifiedBlur, onModifiedChange]);

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
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
  }, [editor, onSave, reactMonaco]);

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
          beforeMount={beforeMount}
          onMount={onMount}
          loading={i18nValues.loading + '...'}
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
