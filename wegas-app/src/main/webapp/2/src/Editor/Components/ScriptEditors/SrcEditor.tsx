import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';

export type MonacoEditor = ReturnType<
  typeof import('monaco-editor').editor.create
>;

interface EditorAction {
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
  run: (
    monaco: typeof import('monaco-editor'),
    editor: import('monaco-editor').editor.ICodeEditor,
  ) => void;
}

export interface EditorProps {
  /**
   * defaultValue - the initial content of the editor.
   * This value is used only once at component first mount.
   */
  defaultValue?: string;
  /**
   * value - the content of the editor
   */
  value?: string;
  /**
   * minimap - the editor shows a minimap of the code
   */
  minimap?: boolean;
  /**
   * readonly - the editor is not listening to keys
   */
  readonly?: boolean;
  /**
   * langauge - the editor language
   */
  language?: 'javascript' | 'plaintext' | 'css' | 'json' | 'typescript';
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
  defaultActions?: EditorAction[];
  /**
   * defaultFocus - force editor to focus on first render
   */
  defaultFocus?: boolean;
  /**
   * defaultExtraLibs - libraries to add to the editor intellisense
   */
  defaultExtraLibs?: { content: string; name?: string }[];
  /**
   * onEditorReady - Callback to give the editor the a higher component
   */
  onEditorReady?: (editor: MonacoEditor) => void;
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

/**
 * SrcEditor is a component uses monaco-editor to create a code edition panel
 */
class SrcEditor extends React.Component<EditorProps> {
  private editor: MonacoEditor | null = null;
  private lastValue?: string = '';
  private outsideChange: boolean = false;
  private container: HTMLDivElement | null = null;

  shouldComponentUpdate(nextProps: EditorProps) {
    return (
      nextProps.value !== this.lastValue ||
      nextProps.language !== this.props.language ||
      nextProps.readonly !== this.props.readonly ||
      nextProps.minimap !== this.props.minimap ||
      nextProps.cursorOffset !== this.props.cursorOffset
    );
  }

  componentDidUpdate(prevProps: EditorProps) {
    if (this.editor !== null) {
      if (this.lastValue !== this.props.value) {
        this.lastValue = this.props.value;
        this.outsideChange = true;
        if ('string' === typeof this.props.value) {
          this.editor.setValue(this.props.value);
        } else {
          this.editor.setValue('');
        }
        this.outsideChange = false;
        if (this.props.defaultFocus) {
          this.editor.focus();
        }
      }
      if (this.props.language !== prevProps.language) {
        import('monaco-editor').then(monaco => {
          if (this.editor) {
            monaco.editor.setModelLanguage(
              this.editor.getModel()!,
              this.props.language ? this.props.language : 'javascript',
            );
          }
        });
      }
      if (this.props.readonly !== prevProps.readonly) {
        this.editor.updateOptions({ readOnly: this.props.readonly });
      }
      if (this.props.minimap !== prevProps.minimap) {
        this.editor.updateOptions({ minimap: { enabled: this.props.minimap } });
      }
      if (this.props.cursorOffset !== prevProps.cursorOffset) {
        const model = this.editor.getModel();
        if (model && this.props.cursorOffset) {
          this.editor.setPosition(model.getPositionAt(this.props.cursorOffset));
        }
      }
      this.editor.layout();
    }
  }

  componentDidMount() {
    this.lastValue = this.props.value;
    Promise.all([
      import('monaco-editor'),
      import('../../../page-schema.build'),
    ]).then(([monaco, t]) => {
      if (this.container != null) {
        this.lastValue = this.props.value;
        // Next line should be called only in json page editor...
        if (this.props.language === 'json') {
          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [
              {
                fileMatch: ['page.json'],
                uri: 'internal://page-schema.json',
                schema: (t as any).schema,
              },
            ],
          });
        }

        // Next code should be called only in javascript...
        if (this.props.language === 'javascript') {
          monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            noLib: false,
            allowNonTsExtensions: true,
          });
          if (this.props.defaultExtraLibs) {
            for (const lib of this.props.defaultExtraLibs) {
              monaco.languages.typescript.javascriptDefaults.addExtraLib(
                lib.content,
                lib.name,
              );
            }
          }
        }

        // Next code should be called only in typescript...
        if (this.props.language === 'typescript') {
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            noLib: false,
            allowNonTsExtensions: true,
            //allowJs: true, /* Has been disabled since the file cannot contain types */
            checkJs: false,
          });
          if (this.props.defaultExtraLibs) {
            for (const lib of this.props.defaultExtraLibs) {
              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                lib.content,
                lib.name,
              );
            }
          }
        }

        const model = monaco.editor.createModel(
          this.props.defaultValue || this.props.value || '',
          this.props.language,
          this.props.defaultUri
            ? monaco.Uri.parse(this.props.defaultUri)
            : undefined,
        );
        this.editor = monaco.editor.create(this.container, {
          theme: 'vs-dark',
          model: model,
          readOnly: this.props.readonly,
          minimap: { enabled: this.props.minimap },
        });
        if (this.props.onEditorReady) {
          this.props.onEditorReady(this.editor);
        }
        this.editor.onDidBlurEditorText(() => {
          if (this.editor && this.props.onBlur) {
            this.lastValue = this.editor.getValue();
            this.props.onBlur(this.lastValue);
          }
        });
        this.editor.onDidChangeModelContent(() => {
          if (!this.outsideChange && this.editor && this.props.onChange) {
            this.lastValue = this.editor.getValue();
            this.props.onChange(this.lastValue);
          }
        });

        this.editor.addAction({
          id: 'onSave',
          label: 'Save code',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
          run: () => {
            if (this.editor && this.props.onSave) {
              this.props.onSave(this.editor.getValue());
            }
          },
        });

        if (this.props.defaultActions) {
          this.props.defaultActions.forEach(action => {
            if (this.editor) {
              this.editor.addAction({
                ...action,
                run: editor => action.run(monaco, editor),
              });
            }
          });
        }
        if (this.props.defaultFocus) {
          this.editor.focus();
        }
      }
    });
  }
  private layout = (size: { width: number; height: number }) => {
    if (this.editor != null) {
      this.editor.layout(size);
    }
  };
  getValue() {
    if (this.editor != null) {
      return this.editor.getValue();
    }
    return this.lastValue;
  }
  getEditor() {
    return this.editor;
  }
  componentWillUnmount() {
    if (this.editor != null && this.editor.getModel() !== null) {
      this.editor.getModel()!.dispose();
      this.editor.dispose();
    }
  }
  refContainer = (n: HTMLDivElement | null) => {
    this.container = n;
  };
  render() {
    return (
      <SizedDiv className={overflowHide}>
        {size => {
          if (size !== undefined) {
            this.layout(size);
          }
          return <div className={overflowHide} ref={this.refContainer} />;
        }}
      </SizedDiv>
    );
  }
}
export default SrcEditor;
