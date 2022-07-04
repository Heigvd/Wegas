import { css, cx } from '@emotion/css';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import {
  isVisibilityAllowed,
  IVisibility,
  LibrariesCallbackMessage,
  librariesCTX,
  LibraryType,
  LibraryWithStatus,
  visibilities,
} from '../../../../Components/Contexts/LibrariesContext';
import { Button } from '../../../../Components/Inputs/Buttons/Button';
import { ConfirmButton } from '../../../../Components/Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../../../Components/Inputs/Buttons/IconButton';
import { Selector } from '../../../../Components/Selector';
import { Toolbar } from '../../../../Components/Toolbar';
import { TreeNode } from '../../../../Components/TreeView/TreeNode';
import { TreeView } from '../../../../Components/TreeView/TreeView';
import {
  defaultMarginBottom,
  defaultMarginLeft,
  defaultMarginRight,
  defaultTooboxLabelContainerStyle,
  defaultToolboxButtonContainerStyle,
  defaultToolboxHeaderStyle,
  defaultToolboxLabelStyle,
  expandBoth,
  flex,
  flexBetween,
  flexColumn,
  globalSelection,
} from '../../../../css/classes';
import { GameModel } from '../../../../data/selectors';
import { editorTabsTranslations } from '../../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../../i18n/internalTranslator';
import { MessageString } from '../../MessageString';
import { TextPrompt } from '../../TextPrompt';
import { MonacoIEditor } from '../editorHelpers';
import MergeEditor from '../MergeEditor';
import SrcEditor, { CodeLocation } from '../SrcEditor';

interface LibraryNodeProps {
  libraryName: string;
  library: LibraryWithStatus;
  onSelectLibrary: () => void;
  selected: boolean;
}

interface LibraryTypeNodeLabelProps {
  libraryType: LibraryType;
  onNewLibrary: (message: LibrariesCallbackMessage) => void;
}

const unsaved = css({
  fontWeight: 'bolder',
});

const conflict = css({
  color: 'var(--colors-errorcolor)',
});

function LibraryTypeNodeLabel({
  libraryType,
  onNewLibrary,
}: LibraryTypeNodeLabelProps) {
  const [editState, setEditState] = React.useState(false);
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const { addLibrary } = React.useContext(librariesCTX);

  return (
    <div
      className={cx(flex, flexBetween, defaultMarginBottom, defaultMarginLeft)}
    >
      {!editState ? (
        <Button
          label={`New ${libraryType} library`}
          icon="plus"
          onClick={() => setEditState(true)}
        />
      ) : (
        <TextPrompt
          placeholder={i18nValues.scripts.libraryName}
          defaultFocus
          onAction={(success, value) => {
            if (success) {
              if (value !== '') {
                addLibrary(libraryType, value, onNewLibrary);
                setEditState(false);
              }
            } else {
              setEditState(false);
            }
          }}
          onBlur={() => setEditState(false)}
          applyOnEnter
        />
      )}
    </div>
  );
}

const labelStyle = css({
  width: '100%',
  ':hover': {
    backgroundColor: 'var(--colors-hovercolor)',
  },
});

function LibraryNode({
  libraryName,
  library,
  onSelectLibrary,
  selected,
}: LibraryNodeProps) {
  return (
    <TreeNode
      notDraggable
      notDroppable
      label={
        <div
          onClick={onSelectLibrary}
          className={cx(
            labelStyle,
            flex,
            flexBetween,
            cx({
              [globalSelection]: selected,
              [unsaved]: library.modified,
              [conflict]: library.conflict,
            }),
          )}
        >
          {libraryName}
          {library.modified && ' [unsaved]'}
          {library.conflict && ' [outdated]'}
        </div>
      }
    />
  );
}

interface CustomLibraryEditorPropsView {
  libraryType?: LibraryType;
  libraryIndex: Record<string, LibraryWithStatus>;
}

/**
 * LibraryEditor is a component for wegas library management
 */
export function CustomLibraryEditorView({
  libraryIndex,
  libraryType,
}: CustomLibraryEditorPropsView) {
  const [message, setMessage] = React.useState<
    LibrariesCallbackMessage | undefined
  >();
  const [mergeMode, setMergeMode] = React.useState(false);
  const [selectedLibraryName, setSelectedLibraryName] = React.useState<
    string | undefined
  >(undefined);

  const { setLibraryVisibility, removeLibrary, saveLibrary } =
    React.useContext(librariesCTX);

  //Reset merge mode each time a file is selected
  React.useEffect(() => {
    setMergeMode(false);
  }, [selectedLibraryName]);

  const currentLibrary: LibraryWithStatus | undefined =
    selectedLibraryName != null ? libraryIndex[selectedLibraryName] : undefined;

  const onNewLibrary = React.useCallback(
    (message: LibrariesCallbackMessage) => {
      if (message.type === 'succes') {
        setSelectedLibraryName(message.message);
      } else {
        setMessage(message);
      }
    },
    [],
  );

  const onSave = React.useMemo(() => {
    if (currentLibrary != null && !currentLibrary.readOnly) {
      return () => {
        if (currentLibrary != null) {
          saveLibrary(currentLibrary.monacoPath, setMessage);
        }
      };
    }
  }, [currentLibrary, saveLibrary]);

  const alloweVisibilities = React.useMemo(() => {
    if (currentLibrary) {
      return visibilities
        .filter(v => isVisibilityAllowed(currentLibrary, v))
        .map(v => ({
          value: v,
          label: v,
        }));
    }
  }, [currentLibrary]);

  const downloadCb = React.useCallback(() => {
    if (currentLibrary != null) {
      const content = currentLibrary.persisted.content;

      const filename = currentLibrary.monacoPath;

      const anchor: HTMLAnchorElement = document.createElement('a');
      anchor.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(content),
      );
      anchor.setAttribute('download', filename);
      anchor.click();
    }
  }, [currentLibrary]);

  const openCodeEditorCb = React.useCallback(
    (codeLocation: CodeLocation, editor: MonacoIEditor) => {
      const fullPath = `${codeLocation.resource.scheme}://${codeLocation.resource.path}`;

      const lib = libraryIndex[fullPath];
      if (lib != null) {
        setSelectedLibraryName(fullPath);

        editor.setSelection(codeLocation.options.selection);
        editor.revealLineInCenter(
          codeLocation.options.selection.startLineNumber,
        );
      }
    },
    [libraryIndex],
  );

  return (
    <ReflexContainer orientation="vertical">
      <ReflexElement
        flex={currentLibrary == null ? 5 : 1}
        className={cx(flex, flexColumn)}
      >
        {libraryType ? (
          <LibraryTypeNodeLabel
            libraryType={libraryType}
            onNewLibrary={onNewLibrary}
          />
        ) : (
          <>
            <LibraryTypeNodeLabel
              libraryType="client"
              onNewLibrary={onNewLibrary}
            />
            <LibraryTypeNodeLabel
              libraryType="server"
              onNewLibrary={onNewLibrary}
            />
            <LibraryTypeNodeLabel
              libraryType="style"
              onNewLibrary={onNewLibrary}
            />
          </>
        )}
        <TreeView rootId={String(GameModel.selectCurrent().id)}>
          {Object.entries(libraryIndex)
            /*Object.entries(librariesState[libraryType])*/
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([libraryName, library]) => (
              <LibraryNode
                key={library.monacoPath}
                libraryName={library.label}
                library={library}
                onSelectLibrary={() => setSelectedLibraryName(libraryName)}
                selected={libraryName === selectedLibraryName}
              />
            ))}
        </TreeView>
      </ReflexElement>
      <ReflexSplitter />
      <ReflexElement flex={currentLibrary == null ? 1 : 5}>
        {currentLibrary == null ? (
          'No library selected yet'
        ) : (
          <Toolbar className={expandBoth}>
            <Toolbar.Header className={defaultToolboxHeaderStyle}>
              <div className={defaultTooboxLabelContainerStyle}>
                <h3 className={defaultToolboxLabelStyle}>
                  {currentLibrary.label}
                </h3>
              </div>
              <div className={defaultToolboxButtonContainerStyle}>
                <Selector
                  readOnly={
                    alloweVisibilities == null ||
                    alloweVisibilities.length === 1
                  }
                  value={currentLibrary.visibility}
                  choices={alloweVisibilities || []}
                  allowUndefined={false}
                  onChange={value =>
                    setLibraryVisibility(
                      currentLibrary.monacoPath,
                      value as IVisibility,
                    )
                  }
                  className={cx(defaultMarginRight, css({ width: '10em' }))}
                />
                {message && (
                  <MessageString
                    type={message.type}
                    value={message.message}
                    duration={5000}
                    onLabelVanish={() => setMessage(undefined)}
                  />
                )}
                {onSave ? (
                  currentLibrary.conflict ? (
                    <IconButton
                      icon="exclamation-triangle"
                      onClick={() => setMergeMode(true)}
                    />
                  ) : (
                    <IconButton
                      disabled={!currentLibrary.modified}
                      icon="save"
                      onClick={onSave}
                    />
                  )
                ) : null}
                <IconButton icon="download" onClick={downloadCb} />
                {!currentLibrary.readOnly ? (
                  <ConfirmButton
                    icon="trash"
                    onAction={success =>
                      success && removeLibrary(currentLibrary.monacoPath)
                    }
                  />
                ) : null}
              </div>
            </Toolbar.Header>
            <Toolbar.Content>
              {currentLibrary.monacoPath != null && currentLibrary != null ? (
                mergeMode ? (
                  <MergeEditor
                    originalContent={currentLibrary.persisted.content}
                    modifiedFileName={currentLibrary.monacoPath}
                    onResolved={() => {
                      setMergeMode(false);
                      if (onSave) {
                        onSave();
                      }
                    }}
                  />
                ) : (
                  <SrcEditor
                    fileName={currentLibrary.monacoPath}
                    onOpenCodeEditor={openCodeEditorCb}
                    onSave={onSave}
                  />
                )
              ) : (
                'No library selected yet'
              )}
            </Toolbar.Content>
          </Toolbar>
        )}{' '}
      </ReflexElement>
    </ReflexContainer>
  );
}
