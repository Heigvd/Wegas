import { css } from 'emotion';
import * as React from 'react';
import { themeVar } from '../../../Components/Theme';
import { Toolbar } from '../../../Components/Toolbar';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import WegasDiffEditor, {
  ExtendedDiffNavigator,
  DiffEditorLineChanges,
} from './WegasDiffEditor';
import { arrayToText, textToArray } from './SrcEditor';
import { MessageString } from '../MessageString';

const diffLabel = css({
  color: themeVar.primaryLighterColor,
  padding: '5px',
});

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

/**
 * The DiffEditor state
 */
interface NavState {
  /**
   * idx - the index of the focused diff
   */
  idx: number;
  /**
   * changes - the list of the diffs with the changed line in original and modified content
   */
  diffs: DiffEditorLineChanges;
}

interface ModalStateClose {
  type: 'close';
}

interface ModalStateError {
  type: 'error';
  label: string;
}

type ModalState = ModalStateClose | ModalStateError;

interface MergeEditorProps {
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
   * langauge - the editor language
   */
  language?: 'typescript' | 'css' | 'json';
  /**
   * onResolved - this function is fired each time the user resolved all diff and want to apply changes
   * Can be fire from the little floppy button or the Ctrl+S
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

function MergeEditor({
  originalValue,
  modifiedValue,
  minimap,
  language,
  onResolved,
  onChange,
  onBlur,
}: MergeEditorProps) {
  const diffNavigator = React.useRef<ExtendedDiffNavigator>();
  const [mergeState, setMergeState] = React.useState<NavState>({
    idx: -1,
    diffs: [],
  });

  /**
   * This must be a state or it will never update the editor when finalValue is modified
   */
  const [finalValue, setFinalValue] = React.useState(originalValue);
  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });

  React.useEffect(() => {
    setFinalValue(originalValue);
  }, [originalValue]);

  const handleDiffNavigator = React.useCallback(
    (navigator: ExtendedDiffNavigator) => (diffNavigator.current = navigator),
    [],
  );

  const onDiffChange = React.useCallback(() => {
    setMergeState(oldState => {
      const navigator = diffNavigator.current;
      if (navigator) {
        const lineChanges = navigator._editor.getLineChanges();
        if (navigator.nextIdx === -1 && lineChanges && lineChanges.length > 0) {
          // When the user clicks on a non diff line, the navigator idx is set to -1
          if (oldState.idx >= 0 && oldState.idx < lineChanges.length) {
            // If the old state idx is still in range, focus the same diff index
            navigator.nextIdx = oldState.idx;
          } else {
            // If the old idx is out of range, ask the navigator to focus the next diff
            navigator.next();
            if (navigator.nextIdx === -1 && lineChanges.length > 0) {
              //Dummy check, it may occure that even with remaining changes nextIdx is set to -1
              navigator.nextIdx = 0;
            }
          }
        }
        return {
          diffs: lineChanges !== null ? lineChanges : [],
          idx: navigator.nextIdx,
        };
      }
      return oldState;
    });
  }, []);

  const onNavigate = (next: boolean) => {
    if (diffNavigator.current) {
      if (next) {
        diffNavigator.current.next();
      } else {
        diffNavigator.current.previous();
      }
      /**
       * Must be triggered to refresh navigator state (no onNavigatorChanged given by monaco-editor API)
       */
      onDiffChange();
    }
  };

  const onSave = React.useCallback(
    (value: string) => {
      if (onResolved) {
        if (mergeState.diffs.length > 0) {
          setModalState({
            type: 'error',
            label: 'You must resolve all differences before saving',
          });
        } else {
          onResolved(value);
        }
      }
    },
    [mergeState.diffs.length, onResolved],
  );

  const onKeepOne = (original: boolean) => {
    const change = mergeState.diffs[mergeState.idx];
    const newContent = original ? finalValue : modifiedValue;
    const oldContent = original ? modifiedValue : finalValue;
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

    const newText = getTextLines(newContent, newStartLine - 1, newEndLine - 1);
    const savedContent =
      oldEndLine > 0 // Checks if line is missing
        ? replaceContent(oldContent, newText, oldStartLine - 1, oldEndLine - 1)
        : insertContent(oldContent, newText, oldStartLine);
    if (original) {
      onChange && onChange(savedContent);
    } else {
      setFinalValue(savedContent);
    }
  };
  const onKeepAll = () => {
    const change = mergeState.diffs[mergeState.idx];
    const origText = getTextLines(
      finalValue,
      change.originalStartLineNumber - 1,
      change.originalEndLineNumber - 1,
    );
    if (origText === null) {
      return onKeepOne(false);
    }
    const modifText = getTextLines(
      modifiedValue,
      change.modifiedStartLineNumber - 1,
      change.modifiedEndLineNumber - 1,
    );
    if (modifText === null) {
      return onKeepOne(true);
    }
    const newText =
      (origText ? origText : '') + '\n' + (modifText ? modifText : '');
    onChange &&
      onChange(
        replaceContent(
          modifiedValue,
          newText,
          change.modifiedStartLineNumber - 1,
          change.modifiedEndLineNumber - 1,
        ),
      );
    setFinalValue(oldValue =>
      replaceContent(
        oldValue,
        newText,
        change.originalStartLineNumber - 1,
        change.originalEndLineNumber - 1,
      ),
    );
  };

  return (
    <Toolbar>
      <Toolbar.Header>
        {mergeState.diffs.length > 0 ? (
          <>
            <IconButton
              icon="arrow-left"
              tooltip="Navigate to previous difference"
              onClick={() => onNavigate(false)}
            />
            <div className={diffLabel}>Difference : #{mergeState.idx}</div>
            <IconButton
              icon="arrow-right"
              tooltip="Navigate to next difference"
              onClick={() => onNavigate(true)}
            />
            <IconButton
              icon="hand-point-left"
              tooltip="Accept remote diff"
              onClick={() => onKeepOne(true)}
            />
            <IconButton
              icon="hand-point-right"
              tooltip="Accept local diff"
              onClick={() => onKeepOne(false)}
            />
            <IconButton
              icon="balance-scale"
              tooltip="Accept both"
              onClick={onKeepAll}
            />
          </>
        ) : (
          <IconButton
            icon="save"
            tooltip="Save current state"
            onClick={() => {
              onSave(modifiedValue);
            }}
          />
        )}
        {modalState.type === 'error' && (
          <MessageString
            type="error"
            value={modalState.label}
            duration={3000}
            onLabelVanish={() => setModalState({ type: 'close' })}
          />
        )}
      </Toolbar.Header>
      <Toolbar.Content>
        <WegasDiffEditor
          originalValue={finalValue}
          modifiedValue={modifiedValue}
          minimap={minimap}
          language={language}
          onModifiedBlur={onBlur}
          onModifiedChange={onChange}
          onSave={onSave}
          onDiffChange={onDiffChange}
          handleDiffNavigator={handleDiffNavigator}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
export default MergeEditor;
