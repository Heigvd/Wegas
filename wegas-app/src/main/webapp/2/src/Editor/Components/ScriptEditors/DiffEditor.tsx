import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';

const overflowHide = css({
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

type DiffEditorType = import('monaco-editor').editor.IStandaloneDiffEditor;
type DiffNavigator = import('monaco-editor').editor.IDiffNavigator;
export type DiffEditorLineChanges = import('monaco-editor').editor.ILineChange[];

/**
 * ExtendedDiffNavigator is an interface that exposes two more attributes than the standard IDiffNavigator
 */
export interface ExtendedDiffNavigator extends DiffNavigator {
  /**
   * _editor - the current diff editor
   */
  _editor: DiffEditorType;
  /**
   * nextIdx - the index of the focused diff
   */
  nextIdx: number;
}

interface DiffEditorProps {
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
  readonly?: boolean;
  /**
   * langauge - the editor language
   */
  language?: 'typescript' | 'css' | 'json';
  /**
   * idx - the index of the diff to be focused
   */
  idx?: number;
  /**
   * handleDiffNavigator - this function gets the diffNavigator that allows navigation between diffs
   */
  handleDiffNavigator?: (diffNavigator: DiffNavigator) => void;
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
   * defaultUri - allows the language to be inferred from this uri
   * To apply changes you must rerender the whole editor (i.e : change the key of the componnent)
   */
  defaultUri?: 'internal://page.json';
}

class DiffEditor extends React.Component<DiffEditorProps> {
  private diffEditor: DiffEditorType | null = null;
  private diffNavigator: ExtendedDiffNavigator | null = null;
  private lastOriginalValue?: string = '';
  private lastModifiedValue?: string = '';
  private modifiedOutsideChange: boolean = false;
  private container: HTMLDivElement | null = null;
  private layout = (size: { width: number; height: number }) => {
    if (this.diffEditor != null) {
      this.diffEditor.layout(size);
    }
  };
  static defaultProps = {
    language: 'javascript',
  };

  shouldComponentUpdate(nextProps: DiffEditorProps) {
    // Checks for relevant props updates
    return (
      nextProps.originalValue !== this.lastOriginalValue ||
      nextProps.modifiedValue !== this.lastModifiedValue ||
      nextProps.language !== this.props.language ||
      nextProps.readonly !== this.props.readonly ||
      nextProps.minimap !== this.props.minimap
    );
  }
  componentDidUpdate(prevProps: DiffEditorProps) {
    // Foreach updated props update their values in the monaco-editor
    if (this.diffEditor !== null && this.diffNavigator !== null) {
      if (this.lastOriginalValue !== this.props.originalValue) {
        this.lastOriginalValue = this.props.originalValue;
        if ('string' === typeof this.props.originalValue) {
          this.diffEditor
            .getOriginalEditor()
            .setValue(this.props.originalValue);
        } else {
          this.diffEditor.getOriginalEditor().setValue('');
        }
      }
      if (this.lastModifiedValue !== this.props.modifiedValue) {
        this.lastModifiedValue = this.props.modifiedValue;
        this.modifiedOutsideChange = true;
        if ('string' === typeof this.props.modifiedValue) {
          this.diffEditor
            .getModifiedEditor()
            .setValue(this.props.modifiedValue);
        } else {
          this.diffEditor.getModifiedEditor().setValue('');
        }
        this.modifiedOutsideChange = false;
      }
      if (this.props.language !== prevProps.language) {
        import('monaco-editor').then(monaco => {
          if (this.diffEditor) {
            const originalModel = this.diffEditor
              .getOriginalEditor()
              .getModel();
            const modifiedModel = this.diffEditor
              .getModifiedEditor()
              .getModel();
            if (originalModel && modifiedModel) {
              const newLanguage = this.props.language
                ? this.props.language
                : DiffEditor.defaultProps.language;
              monaco.editor.setModelLanguage(originalModel, newLanguage);
              monaco.editor.setModelLanguage(modifiedModel, newLanguage);
            }
          }
        });
      }
      if (this.props.readonly !== prevProps.readonly) {
        this.diffEditor.updateOptions({ readOnly: this.props.readonly });
      }
      if (this.props.minimap !== prevProps.minimap) {
        this.diffEditor.updateOptions({
          minimap: { enabled: this.props.minimap },
        });
      }
      this.diffEditor.layout();
    }
  }
  componentDidMount() {
    // Stores these values before and after the lazy loading in order to have a valid value during loading and catch props changes after import
    this.lastOriginalValue = this.props.originalValue;
    this.lastModifiedValue = this.props.modifiedValue;
    Promise.all([
      import('monaco-editor'),
      import('../../../page-schema.build'),
    ]).then(([monaco, t]) => {
      if (this.container != null) {
        this.lastOriginalValue = this.props.originalValue;
        this.lastModifiedValue = this.props.modifiedValue;
        // Sets up the schema for json languages (here, the schema is specific for pages structuring json)
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
        // Creates 2 models for original and modified content
        const originalModel = monaco.editor.createModel(
          this.props.originalValue || '',
          this.props.language,
          this.props.defaultUri
            ? monaco.Uri.parse(this.props.defaultUri)
            : undefined,
        );
        const modifiedModel = monaco.editor.createModel(
          this.props.modifiedValue || '',
          this.props.language,
          this.props.defaultUri
            ? monaco.Uri.parse(this.props.defaultUri)
            : undefined,
        );
        // Creates the monaco diff editor and apply the 2 content models
        this.diffEditor = monaco.editor.createDiffEditor(this.container, {
          theme: 'vs-dark',
          readOnly: this.props.readonly,
          minimap: { enabled: this.props.minimap },
        });
        this.diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel,
        });
        // Catches the changes fire them back to the parent component
        this.diffEditor.onDidUpdateDiff(() => {
          if (this.diffEditor && this.props.onDiffChange) {
            const diffs = this.diffEditor.getLineChanges();
            this.props.onDiffChange(diffs ? diffs : []);
          }
        });
        this.diffEditor.getModifiedEditor().onDidBlurEditorText(() => {
          if (this.diffEditor && this.props.onModifiedBlur) {
            this.lastModifiedValue = this.diffEditor
              .getModifiedEditor()
              .getValue();
            this.props.onModifiedBlur(this.lastModifiedValue);
          }
        });
        this.diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
          if (
            this.diffEditor &&
            !this.modifiedOutsideChange &&
            this.props.onModifiedChange
          ) {
            this.lastModifiedValue = this.diffEditor
              .getModifiedEditor()
              .getValue();
            this.props.onModifiedChange(this.lastModifiedValue);
          }
        });
        // Catches the Ctrl+S action and fire onSave prop
        this.diffEditor.addAction({
          id: 'onSave',
          label: 'Save code',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
          run: () => {
            if (this.diffEditor && this.props.onSave) {
              this.props.onSave(this.diffEditor.getModifiedEditor().getValue());
            }
          },
        });
        // Creates a diff navigator to allow navigation in diffs
        this.diffNavigator = monaco.editor.createDiffNavigator(
          this.diffEditor,
          { ignoreCharChanges: true },
        ) as ExtendedDiffNavigator;
        // Fires the handleDiffNavigator to pass the navigator to the parent component
        this.props.handleDiffNavigator &&
          this.props.handleDiffNavigator(this.diffNavigator);
      }
    });
  }
  getOriginalValue() {
    if (this.diffEditor != null) {
      return this.diffEditor.getOriginalEditor().getValue();
    }
    return this.lastOriginalValue;
  }
  getModifiedValue() {
    if (this.diffEditor != null) {
      return this.diffEditor.getModifiedEditor().getValue();
    }
    return this.lastModifiedValue;
  }
  componentWillUnmount() {
    // Disposes every objects created by monaco-editor
    if (this.diffNavigator) {
      this.diffNavigator.dispose();
    }
    if (this.diffEditor) {
      const originalModel = this.diffEditor.getOriginalEditor().getModel();
      const modifiedModel = this.diffEditor.getModifiedEditor().getModel();
      if (originalModel) {
        originalModel.dispose();
      }
      if (modifiedModel) {
        modifiedModel.dispose();
      }
      this.diffEditor.dispose();
    }
  }

  render() {
    return (
      <SizedDiv className={overflowHide}>
        {size => {
          if (size !== undefined) {
            this.layout(size);
          }
          return (
            <div
              className={overflowHide}
              ref={(n: HTMLDivElement | null) => {
                this.container = n;
              }}
            />
          );
        }}
      </SizedDiv>
    );
  }
}
export default DiffEditor;
