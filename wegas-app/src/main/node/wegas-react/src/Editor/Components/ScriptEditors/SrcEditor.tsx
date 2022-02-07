import { css } from '@emotion/css';
import Editor, { Monaco } from '@monaco-editor/react';
import { debounce } from 'lodash-es';
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
import { getLogger } from '../../../Helper/wegaslog';

const logger = getLogger('monaco');
export interface SrcEditorProps {
  /**
   * map of files to register as model
   */
  models: Record<string, string>;
  /**
   * filename - the name of the file to edit
   */
  fileName: string;
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
  //extraLibs?: MonacoDefinitionsLibrary[];
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
  /**
   * delay - time before sending onChange
   */
  delay?: number;
}

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

export const addExtraLib = (
  service: MonacoLangaugesServices,
  extraLibs?: MonacoDefinitionsLibrary[],
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

let computedPathCounter = 1;

export const computePath = (
  fileName: string | undefined,
  language: SrcEditorLanguages | undefined,
) => {
  if (fileName) {
    return fileName;
  } else {
    // get current value then inc global counter
    const currentCount = computedPathCounter++;
    const timestamp = new Date().getTime();
    return `file:///_generated_${timestamp}_${currentCount}.${languageToFormat(
      language,
    )}`;
  }
};

/**
 * SrcEditor is a component uses monaco-editor to create a code edition panel
 */
function SrcEditor({
  fileName,
  defaultFocus,
  language,
  readOnly,
  minimap,
  cursorOffset,
  models,
  noGutter,
  defaultProperties,
  onEditorReady,
  onBlur,
  onChange,
  onSave,
  defaultActions,
  forceJS,
  delay = 250,
}: SrcEditorProps) {
  const [editor, setEditor] = React.useState<MonacoSCodeEditor>();
  const [reactMonaco, setReactMonaco] = React.useState<MonacoEditor>();
  const i18nValues = useInternalTranslate(commonTranslations);
  const schema = useJSONSchema(language === 'json');

  const onMount = React.useCallback(
    (editor: MonacoSCodeEditor) => {
      setEditor(editor);
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
    [onEditorReady],
  );

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      if (defaultFocus) {
        editor.focus();
      }

      if (cursorOffset) {
        const model = editor.getModel();
        if (model) {
          logger.info('Touch cursor Offset');
          editor.setPosition(model.getPositionAt(cursorOffset));
        }
      }
    }
  }, [cursorOffset, defaultFocus, editor, reactMonaco]);

  React.useEffect(() => {
    if (reactMonaco != null) {
      if (language === 'typescript') {
        reactMonaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          allowNonTsExtensions: true,
          checkJs: true,
          allowJs: forceJS,
          lib: ['es2019'],
          target: reactMonaco.languages.typescript.ScriptTarget.ESNext,
        });
      } else if (language === 'javascript') {
        reactMonaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          allowNonTsExtensions: true,
          checkJs: true,
          allowJs: true,
          lib: ['es5'],
          target: reactMonaco.languages.typescript.ScriptTarget.ES5,
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
  }, [forceJS, language, reactMonaco, schema]);

  // keep last value sent to onChangeProps
  const sentRef = React.useRef({ filename: fileName, value: models[fileName] });
  sentRef.current.filename = fileName;

  // make sure to have up-to-date models
  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      logger.info('Update Models', models);
      Object.entries(models).forEach(([uri, content]) => {
        const libUri = reactMonaco.Uri.parse(uri);
        const existingModel = reactMonaco.editor.getModel(libUri);
        if (existingModel != null) {
          const currentValue = existingModel.getValue();
          if (currentValue !== content) {
            if (
              sentRef.current.filename === uri &&
              content === sentRef.current.value
            ) {
              // sentRef stores the last script sent to the props.onChange callback.
              // Due to async behaviour, the current in-editor model may have been edited before
              // the sent value actially came back in props.models
              // In such case, there is no need to update the currentModel
              // (doing the update will revert the script to a previous value)
              logger.info('Silent Model update: it came from the past');
            } else {
              logger.info('Update Model');

              if (sentRef.current.filename === uri) {
                // updating the current model: try to mitigate cursor jump
                const viewState = editor.saveViewState();
                existingModel.setValue(content);
                if (viewState) {
                  editor.restoreViewState(viewState);
                }
              } else {
                existingModel.setValue(content);
              }
            }
          }
        } else {
          const model = reactMonaco.editor.createModel(
            content,
            language,
            libUri,
          );
          model.setEOL(reactMonaco.editor.EndOfLineSequence.LF);
        }
      });
    }
  }, [editor, models, reactMonaco, language]);

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      editor.onDidBlurEditorText(() => {
        const model = editor.getModel();
        if (onBlur && model) {
          onBlur(model.getValue());
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
          const model = editor.getModel();
          if (onSave && model) {
            onSave(model.getValue());
          }
        },
      });
    }
  }, [editor, onSave, reactMonaco]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const debouncedOnChange = React.useMemo(
    () =>
      debounce((value: string) => {
        if (onChangeRef.current) {
          logger.info('Send On Change: ', value);
          sentRef.current.value = value;
          onChangeRef.current(value);
        }
      }, delay),
    [delay],
  );

  return (
    <SizedDiv className={overflowHide}>
      {size => {
        return (
          <Editor
            height={size ? size.height : undefined} // By default, it fully fits with its parent
            width={size ? size.width : undefined} // By default, it fully fits with its parent
            theme={'dark'}
            beforeMount={monaco => {
              setReactMonaco(monaco);
            }}
            language={language || 'plaintext'}
            path={fileName}
            onMount={onMount}
            loading={i18nValues.loading + '...'}
            options={{
              readOnly,
              fixedOverflowWidgets: true,
              detectIndentation: false,
              insertSpaces: false,
              minimap: { enabled: minimap },
              ...gutter(noGutter),
              ...defaultProperties,
            }}
            onChange={debouncedOnChange}
          />
        );
      }}
    </SizedDiv>
  );
}
export default SrcEditor;
