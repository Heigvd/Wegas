import { css } from 'emotion';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import { themeVar } from '../../../Components/Theme';
import { Toolbar } from '../../../Components/Toolbar';
import { IconButton } from '../../../Components/Button/IconButton';

const diffLabel = css({
  color: themeVar.primaryLighterColor,
  padding: '5px',
});

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
const textToArray = (text: string): string[] => {
  return text.split('\n');
};

/**
 * arrayToText merge an array of lines into a single string
 *
 * @param lines - the array of lines
 */
const arrayToText = (lines: string[]): string => {
  let text = '';
  for (let i = 0; i < lines.length; ++i) {
    text += lines[i] + (i !== lines.length - 1 ? '\n' : '');
  }
  return text;
};

/**
 * getTextLines slice lines in a text
 *
 * @param text - the text to be sliced
 * @param start - the first line of the returned text
 * @param end - the last line of the returned text
 */
const getTextLines = (
  text: string,
  start: number,
  end: number,
): string | null => {
  if (end < start || start < 0) {
    return null;
  }
  return arrayToText(textToArray(text).slice(start, end + 1));
};

/**
 * replaceContent replace lines of a text by a new content
 *
 * @param text - the text to modify
 * @param newContent - the text to insert
 * @param start - the beginning of the replacement
 * @param end - the end of the replacement
 */
const replaceContent = (
  text: string,
  newContent: string | null,
  start: number,
  end: number,
): string => {
  const splittedText = textToArray(text);
  const length = end - start;
  if (newContent === null) {
    // If new content is null, remove lines
    splittedText.splice(start, length + 1);
  } else {
    splittedText.splice(start, length + 1, newContent);
  }
  return arrayToText(splittedText);
};

/**
 * insertContent insert new content in a text
 *
 * @param text - the text to be modified
 * @param newContent - the content to insert
 * @param lineNumber - the position of the insertion
 */
const insertContent = (
  text: string,
  newContent: string | null,
  lineNumber: number,
): string => {
  if (newContent !== null) {
    const splittedText = textToArray(text);
    splittedText.splice(lineNumber, 0, newContent);
    return arrayToText(splittedText);
  }
  return text;
};

type DiffEditorType = import('monaco-editor').editor.IStandaloneDiffEditor;
type DiffNavigator = import('monaco-editor').editor.IDiffNavigator;
type DiffEditorLineChanges = import('monaco-editor').editor.ILineChange[];

/**
 * ExtendedDiffNavigator is an interface that exposes two more attributes than the standard IDiffNavigator
 */
interface ExtendedDiffNavigator extends DiffNavigator {
  /**
   * _editor - the current diff editor
   */
  _editor: DiffEditorType;
  /**
   * nextIdx - the index of the focused diff
   */
  nextIdx: number;
}

/**
 * The DiffEditor state
 */
interface NavState {
  /**
   * hasChanges - tells the ui if it stills diff in the editor
   */
  hasChanges: boolean;
  /**
   * idx - the index of the focused diff
   */
  idx: number;
}

/**
 * refreshIdx synchronize the component state with the diffNavigator state
 * It force the navigator to align on a diff and refresh the hasChanges flag
 *
 * @param diffNavigator - the diff navigator that allows to focus diffs in the diff editor
 */
const refreshIdx = (diffNavigator: ExtendedDiffNavigator) => (
  oldState: NavState,
) => {
  const lineChanges = diffNavigator._editor.getLineChanges();
  if (diffNavigator.nextIdx === -1 && lineChanges && lineChanges.length > 0) {
    // When the user clicks on a non diff line, the navigator idx is set to -1
    if (oldState.idx >= 0 && oldState.idx < lineChanges.length) {
      // If the old state idx is still in range, focus the same diff index
      diffNavigator.nextIdx = oldState.idx;
    } else {
      // If the old idx is out of range, ask the navigator to focus the next diff
      diffNavigator.next();
      if (diffNavigator.nextIdx === -1 && lineChanges.length > 0) {
        //Dummy check, it may occure that even with remaining changes nextIdx is set to -1
        diffNavigator.nextIdx = 0;
      }
    }
  }
  return {
    hasChanges: lineChanges && lineChanges.length > 0,
    idx: diffNavigator.nextIdx,
  };
};

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
  language?: 'javascript' | 'css' | 'json';
  /**
   * onResolved - this function is fired each time the user resolved all diff and want to apply changes
   * There is a small floppy button
   */
  onResolved?: (newContent: string) => void;
  /**
   * onChange - this function is fired each time the user modifies the modifiedValue
   */
  onChange?: (value: string) => void;
  /**
   * onBlur - this function is fired each time the modifiedEditor loose focus
   */
  onBlur?: (value: string) => void;
  /**
   * defaultUri - allows the language to be inferred from this uri
   * To apply changes you must rerender the whole editor (i.e : change the key of the componnent)
   */
  defaultUri?: 'internal://page.json';
}

/**
 * DiffEditor is a component that displays
 */
class DiffEditor extends React.Component<DiffEditorProps> {
  public readonly state: NavState = { hasChanges: true, idx: -1 };
  private diffEditor: DiffEditorType | null = null;
  private diffNavigator: ExtendedDiffNavigator | null = null;
  private lastOriginalValue?: string = '';
  private lastModifiedValue?: string = '';
  private outsideChange: boolean = false;
  private container: HTMLDivElement | null = null;
  static defaultProps = {
    language: 'javascript',
  };

  shouldComponentUpdate(nextProps: DiffEditorProps, nextState: NavState) {
    return (
      nextState.idx !== this.state.idx ||
      nextState.hasChanges !== this.state.hasChanges ||
      nextProps.originalValue !== this.lastOriginalValue ||
      nextProps.modifiedValue !== this.lastModifiedValue ||
      nextProps.language !== this.props.language ||
      nextProps.readonly !== this.props.readonly ||
      nextProps.minimap !== this.props.minimap
    );
  }
  componentDidUpdate(prevProps: DiffEditorProps) {
    if (this.diffEditor !== null && this.diffNavigator !== null) {
      if (this.lastOriginalValue !== this.props.originalValue) {
        this.lastOriginalValue = this.props.originalValue;
        this.outsideChange = true;
        if ('string' === typeof this.props.originalValue) {
          this.diffEditor
            .getOriginalEditor()
            .setValue(this.props.originalValue);
        } else {
          this.diffEditor.getOriginalEditor().setValue('');
        }
        this.outsideChange = false;
      }
      if (this.lastModifiedValue !== this.props.modifiedValue) {
        this.lastModifiedValue = this.props.modifiedValue;
        this.outsideChange = true;
        if ('string' === typeof this.props.modifiedValue) {
          this.diffEditor
            .getModifiedEditor()
            .setValue(this.props.modifiedValue);
        } else {
          this.diffEditor.getModifiedEditor().setValue('');
        }
        this.outsideChange = false;
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
    Promise.all([
      import('monaco-editor'),
      import('../../../page-schema.build'),
    ]).then(([monaco, t]) => {
      if (this.container != null) {
        this.lastOriginalValue = this.props.originalValue;
        this.lastModifiedValue = this.props.modifiedValue;
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
        this.diffEditor = monaco.editor.createDiffEditor(this.container, {
          theme: 'vs-dark',
          readOnly: this.props.readonly,
          minimap: { enabled: this.props.minimap },
        });
        this.diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel,
        });
        this.diffEditor.onDidUpdateDiff(() => {
          this.diffNavigator && this.setState(refreshIdx(this.diffNavigator));
        });
        this.diffEditor.getModifiedEditor().onDidBlurEditorText(() => {
          if (this.diffEditor && this.props.onBlur) {
            this.lastModifiedValue = this.diffEditor
              .getModifiedEditor()
              .getValue();
            this.props.onBlur(this.lastModifiedValue);
          }
        });
        this.diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
          if (this.diffEditor) {
            if (!this.outsideChange && this.props.onChange) {
              this.lastModifiedValue = this.diffEditor
                .getModifiedEditor()
                .getValue();
              this.props.onChange(this.lastModifiedValue);
            }
          }
        });
        this.diffEditor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
          this.onSave,
        );
        this.diffNavigator = monaco.editor.createDiffNavigator(
          this.diffEditor,
          { ignoreCharChanges: true },
        ) as ExtendedDiffNavigator;
      }
    });
  }
  private layout = (size: { width: number; height: number }) => {
    if (this.diffEditor != null) {
      this.diffEditor.layout(size);
    }
  };
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
  refContainer = (n: HTMLDivElement | null) => {
    this.container = n;
  };

  private onSave = () => {
    if (this.diffEditor && this.props.onResolved) {
      const lineChanges = this.diffEditor.getLineChanges();
      if (lineChanges && lineChanges.length > 0) {
        alert('You must resolve all differences before saving');
      } else {
        this.props.onResolved(this.diffEditor.getOriginalEditor().getValue());
      }
    }
  };

  private onNavigate = (next: boolean) => {
    if (this.diffNavigator) {
      if (next) {
        this.diffNavigator.next();
      } else {
        this.diffNavigator.previous();
      }
      this.setState(refreshIdx(this.diffNavigator));
    }
  };

  private onKeepOne = (original: boolean) => {
    if (this.diffEditor) {
      const lineChanges: DiffEditorLineChanges | null = this.diffEditor.getLineChanges();
      if (lineChanges && lineChanges.length > 0) {
        const content = this.diffEditor.getOriginalEditor().getValue();
        const change = lineChanges[this.state.idx];
        const modified = this.diffEditor.getModifiedEditor().getValue();
        const newContent = original ? content : modified;
        const oldContent = original ? modified : content;
        const newStartLine = original
          ? change.originalStartLineNumber
          : change.modifiedStartLineNumber;
        const newEndLine = original
          ? change.originalEndLineNumber
          : change.modifiedEndLineNumber;
        const oldStartLine = original
          ? change.modifiedStartLineNumber
          : change.originalStartLineNumber;
        const oldEndLine = original
          ? change.modifiedEndLineNumber
          : change.originalEndLineNumber;

        const newText = getTextLines(
          newContent,
          newStartLine - 1,
          newEndLine - 1,
        );
        const savedContent =
          oldEndLine > 0 // Checks if line is missing
            ? replaceContent(
                oldContent,
                newText,
                oldStartLine - 1,
                oldEndLine - 1,
              )
            : insertContent(oldContent, newText, oldStartLine);
        if (original) {
          this.diffEditor.getModifiedEditor().setValue(savedContent);
        } else {
          this.diffEditor.getOriginalEditor().setValue(savedContent);
        }
      }
    }
  };
  private onKeepAll = () => {
    if (this.diffEditor) {
      const lineChanges: DiffEditorLineChanges | null = this.diffEditor.getLineChanges();
      if (lineChanges && lineChanges.length > 0) {
        const content = this.diffEditor.getOriginalEditor().getValue();
        const modified = this.diffEditor.getModifiedEditor().getValue();
        const change = lineChanges[this.state.idx];
        const origText = getTextLines(
          content,
          change.originalStartLineNumber - 1,
          change.originalEndLineNumber - 1,
        );
        if (origText === null) {
          return this.onKeepOne(false);
        }
        const modifText = getTextLines(
          modified,
          change.modifiedStartLineNumber - 1,
          change.modifiedEndLineNumber - 1,
        );
        if (modifText === null) {
          return this.onKeepOne(true);
        }
        const newText =
          (origText ? origText : '') + '\n' + (modifText ? modifText : '');
        this.diffEditor
          .getModifiedEditor()
          .setValue(
            replaceContent(
              modified,
              newText,
              change.modifiedStartLineNumber - 1,
              change.modifiedEndLineNumber - 1,
            ),
          );
        this.diffEditor
          .getOriginalEditor()
          .setValue(
            replaceContent(
              content,
              newText,
              change.originalStartLineNumber - 1,
              change.originalEndLineNumber - 1,
            ),
          );
      }
    }
  };

  render() {
    return (
      <Toolbar>
        <Toolbar.Header>
          {this.state.hasChanges ? (
            <>
              <IconButton
                icon="arrow-left"
                tooltip="Navigate to previous difference"
                onClick={() => this.onNavigate(false)}
              />
              <div className={diffLabel}>Difference : #{this.state.idx}</div>
              <IconButton
                icon="arrow-right"
                tooltip="Navigate to next difference"
                onClick={() => this.onNavigate(true)}
              />
              <IconButton
                icon="hand-point-left"
                tooltip="Accept remote diff"
                onClick={() => this.onKeepOne(true)}
              />
              <IconButton
                icon="hand-point-right"
                tooltip="Accept local diff"
                onClick={() => this.onKeepOne(false)}
              />
              <IconButton
                icon="balance-scale"
                tooltip="Accept both"
                onClick={this.onKeepAll}
              />
            </>
          ) : (
            <IconButton
              icon="save"
              tooltip="Save current state"
              onClick={this.onSave}
            />
          )}
        </Toolbar.Header>
        <Toolbar.Content>
          <SizedDiv className={overflowHide}>
            {size => {
              if (size !== undefined) {
                this.layout(size);
              }
              return <div className={overflowHide} ref={this.refContainer} />;
            }}
          </SizedDiv>
        </Toolbar.Content>
      </Toolbar>
    );
  }
}
export default DiffEditor;
