import { css } from '@emotion/css';
import Editor, { Monaco } from '@monaco-editor/react';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import {
  MonacoDefinitionsLibrary,
  MonacoEditor,
  MonacoEditorProperties,
  MonacoLangaugesServices,
  MonacoSCodeEditor,
  SrcEditorAction,
  SrcEditorLanguages,
} from './editorHelpers';
import { useJSONSchema } from './useJSONSchema';

export interface SrcEditorProps {
  /**
   * filename - the name of the current file
   */
  fileName?: string;
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
   * timeout - the timeout before changes applies
   */
  timeout?: number | undefined;
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
   * defaultKeyEvents - a list of key event to be caught in the editor
   */
  defaultActions?: (monaco: Monaco) => SrcEditorAction[];
  /**
   * defaultFocus - force editor to focus on first render
   */
  defaultFocus?: boolean;
  /**
   * extraLibs - libraries to add to the editor intellisense
   */
  extraLibs?: MonacoDefinitionsLibrary[];
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

export function languageToFormat(language: SrcEditorLanguages | undefined) {
  switch (language) {
    case 'css':
      return 'css';
    case 'javascript':
      return 'js';
    case 'json':
      return 'json';
    case 'plaintext':
      return 'txt';
    case 'typescript':
      return 'ts';
    default:
      'txt';
  }
}

/**
 * SrcEditor is a component uses monaco-editor to create a code edition panel
 */
function SrcEditor({
  fileName,
  value,
  defaultFocus,
  language,
  readOnly,
  minimap,
  cursorOffset,
  extraLibs,
  noGutter,
  defaultProperties,
  timeout = 100,
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
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const i18nValues = useInternalTranslate(commonTranslations);
  const schema = useJSONSchema(language === 'json');

  const onMount = React.useCallback(
    (editor: MonacoSCodeEditor, reactMonaco: Monaco) => {
      getValue.current = editor.getValue;
      setEditor(editor);

      const newModel = reactMonaco.editor.createModel(
        value || '',
        language || 'plaintext',
        reactMonaco.Uri.parse(
          `file:///${
            fileName || String(new Date().getTime())
          }.${languageToFormat(language)}`,
        ),
      );

      newModel.updateOptions({ tabSize: 2 });

      editor.setModel(newModel);

      if (onEditorReady) {
        onEditorReady(editor);
      }

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
    },
    [fileName, language, onEditorReady, value],
  );

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      if (defaultFocus) {
        editor.focus();
      }
      if (cursorOffset) {
        const model = editor.getModel();
        if (model) {
          editor.setPosition(model.getPositionAt(cursorOffset));
        }
      }
    }
  }, [
    cursorOffset,
    defaultFocus,
    editor,
    extraLibs,
    forceJS,
    language,
    reactMonaco,
    schema,
  ]);

  React.useEffect(() => {
    if (reactMonaco != null) {
      if (language === 'typescript') {
        reactMonaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          allowNonTsExtensions: true,
          checkJs: true,
          allowJs: forceJS,
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
  }, [extraLibs, forceJS, language, reactMonaco, schema]);

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      extraLibs
        ?.filter(lib => {
          return !reactMonaco.editor
            .getModels()
            .map(model => model.uri.path)
            .includes(reactMonaco.Uri.parse(lib.name).path);
        })
        .forEach(lib => {
          reactMonaco.editor.createModel(
            lib.content,
            'typescript',
            reactMonaco.Uri.parse(lib.name),
          );
        });
    }
  }, [editor, extraLibs, reactMonaco]);

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      editor.onDidBlurEditorText(() => {
        if (onBlur && getValue.current) {
          onBlur(getValue.current());
        }
      });
    }
  }, [editor, onBlur, reactMonaco]);

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      if (defaultActions) {
        defaultActions(reactMonaco).forEach(action => {
          editor.addAction({
            ...action,
            run: editor => action.run(reactMonaco, editor),
          });
        });
      }
    }
  }, [defaultActions, editor, reactMonaco]);

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
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
    }
  }, [editor, onSave, reactMonaco]);

  return (
    <SizedDiv className={overflowHide}>
      {size => {
        return (
          <Editor
            height={size ? size.height : undefined} // By default, it fully fits with its parent
            width={size ? size.width : undefined} // By default, it fully fits with its parent
            theme={'dark'}
            language={language}
            beforeMount={monaco => {
              setReactMonaco(monaco);
            }}
            value={value}
            onMount={onMount}
            loading={i18nValues.loading + '...'}
            options={{
              readOnly,
              minimap: { enabled: minimap },
              ...gutter(noGutter),
              ...defaultProperties,
            }}
            onChange={(newVal, _event) => {
              if (getValue.current) {
                if (newVal !== editorValue.current) {
                  editorValue.current = newVal || '';
                  if (onChange) {
                    if (timeout) {
                      if (timeoutRef.current != null) {
                        clearTimeout(timeoutRef.current);
                      }
                      timeoutRef.current = setTimeout(() => {
                        onChange(newVal || '');
                      }, timeout);
                    } else {
                      onChange(newVal || '');
                    }
                  }
                }
              }
            }}
          />
        );
      }}
    </SizedDiv>
  );
}
export default SrcEditor;
