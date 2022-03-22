import { css } from '@emotion/css';
import { Monaco } from '@monaco-editor/react';
import * as React from 'react';
import {
  getModel,
  useTempModel,
} from '../../../Components/Contexts/LibrariesContext';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import { MessageString } from '../MessageString';
import {
  arrayToText,
  MonacoEditorModel,
  MonacoSDiffEditor,
  textToArray,
} from './editorHelpers';
import WegasDiffEditor, {
  DiffEditorLineChanges,
  ExtendedDiffNavigator,
} from './WegasDiffEditor';

const diffLabel = css({
  color: themeVar.colors.DarkTextColor,
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
   * originalContent - the content of the original file
   */
  originalContent: string;
  /**
   * filename - the name of the current modified file
   */
  modifiedFileName: string;
  /**
   * minimap - the editor shows a minimap of the code
   */
  minimap?: boolean;
  /**
   * onResolved - this function is fired each time the user resolved all diff and want to apply changes
   * Can be fire from the little floppy button or the Ctrl+S
   */
  onResolved: () => void;
}

function MergeEditor({
  originalContent,
  modifiedFileName,
  minimap,
  onResolved,
}: MergeEditorProps) {
  const persistedModel = React.useRef<MonacoEditorModel | null>(null);
  const modifiedModel = React.useRef<MonacoEditorModel | null>(null);
  const diffNavigator = React.useRef<ExtendedDiffNavigator>();
  const [mergeState, setMergeState] = React.useState<NavState>({
    idx: -1,
    diffs: [],
  });
  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });

  persistedModel.current = useTempModel(originalContent, 'typescript');

  React.useEffect(() => {
    persistedModel.current?.setValue(originalContent);
  }, [originalContent]);

  const beforeMount = React.useCallback(
    (monaco: Monaco) => {
      modifiedModel.current = getModel(monaco, modifiedFileName);
    },
    [modifiedFileName],
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

  const handleDiffNavigator = React.useCallback(
    (editor: MonacoSDiffEditor, navigator: ExtendedDiffNavigator) => {
      diffNavigator.current = navigator;
      editor.onDidUpdateDiff(onDiffChange);
    },
    [onDiffChange],
  );

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

  const onSave = React.useCallback(() => {
    if (mergeState.diffs.length > 0) {
      setModalState({
        type: 'error',
        label: 'You must resolve all differences before saving',
      });
    } else {
      onResolved();
    }
  }, [mergeState.diffs.length, onResolved]);

  const onKeepOne = React.useCallback(
    (original: boolean) => {
      if (persistedModel.current != null && modifiedModel.current != null) {
        const persistedValue = persistedModel.current.getValue();
        const modifiedValue = modifiedModel.current.getValue();
        const change = mergeState.diffs[mergeState.idx];
        const newContent = original ? persistedValue : modifiedValue;
        const oldContent = original ? modifiedValue : persistedValue;
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
          modifiedModel.current.setValue(savedContent);
        } else {
          persistedModel.current.setValue(savedContent);
        }
      }
    },
    [mergeState.diffs, mergeState.idx],
  );

  const onKeepAll = React.useCallback(() => {
    if (persistedModel.current != null && modifiedModel.current != null) {
      const persistedValue = persistedModel.current.getValue();
      const modifiedValue = modifiedModel.current.getValue();

      const change = mergeState.diffs[mergeState.idx];
      const origText = getTextLines(
        persistedValue,
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
      modifiedModel.current.setValue(
        replaceContent(
          modifiedValue,
          newText,
          change.modifiedStartLineNumber - 1,
          change.modifiedEndLineNumber - 1,
        ),
      );

      persistedModel.current.setValue(
        replaceContent(
          persistedValue,
          newText,
          change.originalStartLineNumber - 1,
          change.originalEndLineNumber - 1,
        ),
      );
    }
  }, [mergeState.diffs, mergeState.idx, onKeepOne]);

  return (
    <Toolbar>
      <Toolbar.Header>
        {mergeState.diffs.length > 0 ? (
          <>
            <Button
              icon="arrow-left"
              tooltip="Navigate to previous difference"
              onClick={() => onNavigate(false)}
            />
            <div className={diffLabel}>Difference : #{mergeState.idx}</div>
            <Button
              icon="arrow-right"
              tooltip="Navigate to next difference"
              onClick={() => onNavigate(true)}
            />
            <Button
              icon="hand-point-left"
              tooltip="Accept remote diff"
              onClick={() => onKeepOne(true)}
            />
            <Button
              icon="hand-point-right"
              tooltip="Accept local diff"
              onClick={() => onKeepOne(false)}
            />
            <Button
              icon="balance-scale"
              tooltip="Accept both"
              onClick={onKeepAll}
            />
          </>
        ) : (
          <Button icon="save" tooltip="Save current state" onClick={onSave} />
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
          modifiedFileName={modifiedFileName}
          persistedFileName={persistedModel.current?.uri.toString()}
          minimap={minimap}
          onSave={onSave}
          onBeforeMount={beforeMount}
          handleDiffNavigator={handleDiffNavigator}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
export default MergeEditor;
