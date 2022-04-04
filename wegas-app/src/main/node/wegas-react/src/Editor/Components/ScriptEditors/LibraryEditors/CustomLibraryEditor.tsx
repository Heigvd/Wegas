import { css, cx } from '@emotion/css';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import {
  computeLibraryPath,
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
  defaultMarginRight,
  defaultPadding,
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
import MergeEditor from '../MergeEditor';
import SrcEditor from '../SrcEditor';

interface LibraryNodeProps {
  libraryName: string;
  library: LibraryWithStatus;
  onSelectLibrary: () => void;
  selected: boolean;
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

interface LibraryTypeNodeLabelProps {
  libraryType: LibraryType;
  onNewLibrary: (message: LibrariesCallbackMessage) => void;
}

function LibraryTypeNodeLabel({
  libraryType,
  onNewLibrary,
}: LibraryTypeNodeLabelProps) {
  const [editState, setEditState] = React.useState(false);
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const { addLibrary } = React.useContext(librariesCTX);

  return (
    <div className={cx(flex, flexBetween)}>
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

interface CustomLibraryEditorProps {
  libraryType: LibraryType;
}

/**
 * LibraryEditor is a component for wegas library management
 */
export function CustomLibraryEditor({ libraryType }: CustomLibraryEditorProps) {
  const [message, setMessage] =
    React.useState<LibrariesCallbackMessage | undefined>();
  const [mergeMode, setMergeMode] = React.useState(false);
  const [selectedLibraryName, setSelectedLibraryName] =
    React.useState<string | undefined>(undefined);

  const { librariesState, saveLibrary, setLibraryVisibility, removeLibrary } =
    React.useContext(librariesCTX);

  //Reset merge mode each time a file is selected
  React.useEffect(() => {
    setMergeMode(false);
  }, [selectedLibraryName]);

  const currentLibrary = React.useMemo(() => {
    if (selectedLibraryName != null) {
      return librariesState[libraryType][selectedLibraryName];
    }
  }, [librariesState, libraryType, selectedLibraryName]);

  const libraryPath =
    selectedLibraryName != null
      ? computeLibraryPath(selectedLibraryName, libraryType)
      : undefined;

  const onSave = React.useCallback(() => {
    if (selectedLibraryName != null) {
      saveLibrary(libraryType, selectedLibraryName, setMessage);
    }
  }, [libraryType, saveLibrary, selectedLibraryName]);

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

  const downloadCb = React.useCallback(() => {
    if (currentLibrary != null) {
      const content = currentLibrary.persisted.content;

      const extension =
        libraryType === 'client'
          ? 'ts'
          : libraryType === 'server'
          ? 'js'
          : 'css';

      const filename = `${selectedLibraryName}.${extension}`;

      const anchor: HTMLAnchorElement = document.createElement('a');
      anchor.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(content),
      );
      anchor.setAttribute('download', filename);
      anchor.click();
    }
  }, [currentLibrary, selectedLibraryName, libraryType]);

  return (
    <ReflexContainer orientation="vertical">
      <ReflexElement flex={1} className={cx(flex, flexColumn)}>
        <LibraryTypeNodeLabel
          libraryType={libraryType}
          onNewLibrary={onNewLibrary}
        />
        <TreeView rootId={String(GameModel.selectCurrent().id)}>
          {Object.entries(librariesState[libraryType])
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([libraryName, library]) => (
              <LibraryNode
                key={library.persisted.id!}
                libraryName={libraryName}
                library={library}
                onSelectLibrary={() => setSelectedLibraryName(libraryName)}
                selected={libraryName === selectedLibraryName}
              />
            ))}
        </TreeView>
      </ReflexElement>
      <ReflexSplitter />
      <ReflexElement flex={5}>
        <Toolbar className={expandBoth}>
          <Toolbar.Header className={defaultPadding}>
            {selectedLibraryName == null || currentLibrary == null ? (
              'No library selected yet'
            ) : (
              <>
                <h2>{selectedLibraryName}</h2>
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
                      libraryType,
                      selectedLibraryName,
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
              </>
            )}
            {selectedLibraryName != null && currentLibrary && (
              <>
                {currentLibrary.conflict ? (
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
                )}
                <IconButton icon="download" onClick={downloadCb} />
                <ConfirmButton
                  icon="trash"
                  onAction={success =>
                    success && removeLibrary(libraryType, selectedLibraryName)
                  }
                />
              </>
            )}
          </Toolbar.Header>
          <Toolbar.Content>
            {libraryPath != null && currentLibrary != null ? (
              mergeMode ? (
                <MergeEditor
                  originalContent={currentLibrary.persisted.content}
                  modifiedFileName={libraryPath}
                  onResolved={() => {
                    setMergeMode(false);
                    onSave();
                  }}
                />
              ) : (
                <SrcEditor fileName={libraryPath} onSave={onSave} />
              )
            ) : (
              'No library selected yet'
            )}
          </Toolbar.Content>
        </Toolbar>
      </ReflexElement>
    </ReflexContainer>
  );
}
