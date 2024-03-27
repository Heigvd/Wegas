import { DiffEditor, Monaco } from '@monaco-editor/react';
import * as React from 'react';
import { SizedDiv } from '../../../Components/SizedDiv';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { MonacoEditorProperties, MonacoSDiffEditor } from './editorHelpers';
import { editorStyle, gutter } from './SrcEditor';

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
   * filename - the name of the current modified file
   */
  persistedFileName?: string;
  /**
   * filename - the name of the current modified file
   */
  modifiedFileName?: string;
  /**
   * minimap - the editor shows a minimap of the code
   */
  minimap?: boolean;
  /**
   * readonly - the editor is not listening to keys
   */
  readOnly?: boolean;
  /**
   * idx - the index of the diff to be focused
   */
  idx?: number;
  /**
   * handleDiffNavigator - this function gets the diffNavigator that allows navigation between diffs
   */
  handleDiffNavigator?: (
    editor: MonacoSDiffEditor,
    diffNavigator: MonacoDiffNavigator,
  ) => void;
  /**
   * onBlur - this function is fired each time the modifiedEditor loose focus
   */
  onSave?: () => void;
  /**
   * onEditorReady - Callback to give the editor the a higher component
   */
  onEditorReady?: (editor: MonacoSDiffEditor) => void;
  /**
   * onBeforeMount - called at monaco initialisation
   */
  onBeforeMount?: (monaco: Monaco) => void;
  /**
   * defaultProperties - Add specific properties for monaco-editor
   */
  defaultProperties?: MonacoEditorProperties;
  /**
   * noGutter - If true, completely hides the left margin (line numbers and symbols)
   */
  noGutter?: boolean;
}

function WegasDiffEditor({
  modifiedFileName,
  persistedFileName,
  readOnly,
  minimap,
  noGutter,
  defaultProperties,
  onEditorReady,
  onSave,
  onBeforeMount,
  handleDiffNavigator,
  idx,
}: WegasDiffEditorProps) {
  const refNavigator = React.useRef<ExtendedDiffNavigator>();
  const i18nValues = useInternalTranslate(commonTranslations);

  React.useEffect(() => {
    const navigator = refNavigator.current;
    if (idx && navigator) {
      const firstIdx = navigator.nextIdx;
      while (navigator.nextIdx !== idx && navigator.nextIdx !== firstIdx) {
        navigator.next();
      }
      if (navigator.nextIdx === idx) {
        navigator.next();
      }
    }
  }, [idx]);

  const onMount = React.useCallback(
    (editor: MonacoSDiffEditor, reactMonaco: Monaco) => {
      // Creates a diff navigator to allow navigation in diffs
      const navigator = reactMonaco.editor.createDiffNavigator(editor, {
        ignoreCharChanges: true,
      }) as ExtendedDiffNavigator;
      if (handleDiffNavigator) {
        handleDiffNavigator(editor, navigator);
      }
      refNavigator.current = navigator;

      if (editor != null && reactMonaco != null) {
        editor.addAction({
          id: 'onSave',
          label: 'Save code',
          keybindings: [reactMonaco.KeyMod.CtrlCmd | reactMonaco.KeyCode.KEY_S],
          run: () => {
            onSave && onSave();
          },
        });
      }

      if (onEditorReady) {
        onEditorReady(editor);
      }
    },
    [handleDiffNavigator, onEditorReady, onSave],
  );

  return (
    <SizedDiv className={editorStyle}>
      {size => (
        <DiffEditor
          beforeMount={onBeforeMount}
          height={size ? size.height : undefined} // By default, it fully fits with its parent
          width={size ? size.width : undefined} // By default, it fully fits with its parent
          originalModelPath={persistedFileName}
          modifiedModelPath={modifiedFileName}
          onMount={onMount}
          loading={i18nValues.loading + '...'}
          keepCurrentModifiedModel
          keepCurrentOriginalModel
          options={{
            readOnly,
            tabSize: 2,
            insertSpaces: true,
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
