import { css, cx } from '@emotion/css';
import Editor, { Monaco } from '@monaco-editor/react';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import { getLogger } from '../../../Helper/wegaslog';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import {
  MonacoDefinitionsLibrary,
  MonacoEditor,
  MonacoEditorProperties,
  MonacoIEditor,
  MonacoLangaugesServices,
  MonacoSCodeEditor,
  SrcEditorAction,
  SrcEditorLanguages,
} from './editorHelpers';

const logger = getLogger('monaco');

/**
 * Monaco Typings are, indeed, well defined and well documented
 */
export interface CodeLocation {
  resource: {
    /** absolute path, without scheme (eg. /my/path/myFile.ts) */
    path: string;
    /** schem part (eg. the part before double-slash) */
    scheme: string;
  };
  options: {
    selection: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
    /** no idea */
    selectionRevealType: number;
  };
}

export interface SrcEditorProps {
  /**
   * filename - the name of the file to edit
   */
  fileName?: string;
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
   * cursorOffset - the position of the cursor in the text
   */
  cursorOffset?: number;
  /**
   * timeout - the timeout before changes applies
   */
  timeout?: number | undefined;
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
   * onEditorReady - Callback to give the editor the a higher component
   */
  onEditorReady?: (editor: MonacoSCodeEditor) => void;
  /**
   * defaultProperties - Add specific properties for monaco-editor
   */
  defaultProperties?: MonacoEditorProperties;
  /**
   * to handle ctrl-click
   */
  onOpenCodeEditor?: (
    codeLocation: CodeLocation,
    source: MonacoIEditor,
  ) => void;
}

const errorStyle = css({
  '& .squiggly-error': {
    ':before': {
      content: "' '",
      backgroundColor: 'red',
      left: 0,
      width: '4px',
      height: '19px',
      position: 'fixed',
    },
  },
});

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

export const editorStyle = cx(overflowHide, errorStyle, css({"> section": {
  // "!important is used to overide "style" attribute, injected by monaco itself...
  // https://github.com/frenic/csstype/issues/114
  position: 'absolute !important'as 'absolute'
}}));

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

interface WithEditorService {
  _codeEditorService: {
    openCodeEditor: (input: CodeLocation, source: MonacoIEditor) => unknown;
  };
}

/**
 * SrcEditor is a component uses monaco-editor to create a code edition panel
 */
function SrcEditor({
  fileName,
  defaultFocus,
  readOnly,
  minimap,
  cursorOffset,
  noGutter,
  defaultProperties,
  onEditorReady,
  onBlur,
  onSave,
  defaultActions,
  onOpenCodeEditor,
}: SrcEditorProps) {
  const [editor, setEditor] = React.useState<MonacoSCodeEditor>();
  const [reactMonaco, setReactMonaco] = React.useState<MonacoEditor>();
  const i18nValues = useInternalTranslate(commonTranslations);

  React.useEffect(() => {
    if (editor) {
      /** intercept ctrl-click */
      const editorService = (editor as unknown as WithEditorService)
        ._codeEditorService;
      // default function
      const openEditorBase = editorService.openCodeEditor.bind(editorService);
      editorService.openCodeEditor = async (input, source) => {
        // since editorServivce is a singleton, make sure the event comes from the current editor
        if (source === editor) {
          //call default function
          const result = await openEditorBase(input, source);

          if (result === null) {
            // default function does not return anything, it means the ctrl-click target
            // is outside the current model
            if (onOpenCodeEditor) {
              onOpenCodeEditor(input, source);
            }
          }
          return result; // always return the base result
        } else {
          return await openEditorBase(input, source);
        }
      };
    }
  }, [editor, onOpenCodeEditor]);

  const onMount = React.useCallback(
    (editor: MonacoSCodeEditor) => {
      setEditor(editor);
      if (onEditorReady) {
        onEditorReady(editor);
      }

      // // Unmount effect to dispose editor and model
      // return () => {
      //   if (editor) {
      //     const model = editor.getModel();
      //     if (model) {
      //       model.dispose();
      //     }
      //     editor.dispose();
      //   }
      // };
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
    if (editor != null && reactMonaco != null) {
      const listener = editor.onDidBlurEditorText(() => {
        const model = editor.getModel();
        if (onBlur && model) {
          onBlur(model.getValue());
        }
      });
      return () => {
        listener.dispose();
      };
    }
  }, [editor, onBlur, reactMonaco]);

  React.useEffect(() => {
    if (editor != null && reactMonaco != null) {
      if (defaultActions) {
        const listeneres = defaultActions(reactMonaco).map(action =>
          editor.addAction({
            ...action,
            run: editor => action.run(reactMonaco, editor),
          }),
        );
        return () => {
          listeneres.forEach(l => l.dispose());
        };
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

  // const onChangeRef = React.useRef(onChange);
  // onChangeRef.current = onChange;

  // const debouncedOnChange = React.useMemo(
  //   () =>
  //     debounce((value: string) => {
  //       if (onChangeRef.current) {
  //         logger.info('Send On Change: ', value);
  //         onChangeRef.current(value);
  //       }
  //     }, delay),
  //   [delay],
  // );

  return (
    <SizedDiv className={editorStyle}>
      {size => {
        return (
          <Editor
            height={size ? size.height : undefined} // By default, it fully fits with its parent
            width={size ? size.width : undefined} // By default, it fully fits with its parent
            theme={'dark'}
            beforeMount={monaco => {
              setReactMonaco(monaco);
            }}
            // language={language}
            // value={value}
            keepCurrentModel
            path={fileName}
            onMount={onMount}
            loading={i18nValues.loading + '...'}
            options={{
              readOnly,
              fixedOverflowWidgets: true,
              scrollBeyondLastLine: false,
              detectIndentation: false,
              tabSize: 2,
              insertSpaces: true,
              minimap: { enabled: minimap },
              ...gutter(noGutter),
              ...defaultProperties,
            }}
            // onChange={debouncedOnChange}
          />
        );
      }}
    </SizedDiv>
  );
}
export default SrcEditor;
