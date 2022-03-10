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
} from '../../../Components/Contexts/LibrariesContext';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { Selector } from '../../../Components/Selector';
import { Toolbar } from '../../../Components/Toolbar';
import { TreeNode } from '../../../Components/TreeView/TreeNode';
import {
  ALWAYS_OPEN_BUTTONS,
  TreeView,
} from '../../../Components/TreeView/TreeView';
import {
  defaultMarginRight,
  defaultPadding,
  expandBoth,
  flex,
  flexBetween,
  globalSelection,
} from '../../../css/classes';
import { GameModel } from '../../../data/selectors';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { MessageString } from '../MessageString';
import { TextPrompt } from '../TextPrompt';
import SrcEditor from './SrcEditor';

interface LibraryNodeProps {
  libraryName: string;
  library: LibraryWithStatus;
  onSelectLibrary: () => void;
  selected: boolean;
}

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
            flex,
            flexBetween,
            cx({
              [globalSelection]: selected,
            }),
          )}
        >
          {libraryName}
          {library.modified && '[unsaved]'}
          {library.conflict && '[outdated]'}
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
      {libraryType}
      {!editState ? (
        <IconButton icon="plus" onClick={() => setEditState(true)} />
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

interface LibraryTypeNodeProps {
  libraryType: LibraryType;
  onSelectLibrary: (libraryName: string) => void;
  onNewLibrary: (message: LibrariesCallbackMessage) => void;
  selectedLibraryName: string | undefined;
}

function LibraryTypeNode({
  libraryType,
  onSelectLibrary,
  onNewLibrary,
  selectedLibraryName,
}: LibraryTypeNodeProps) {
  const { librariesState } = React.useContext(librariesCTX);
  return (
    <TreeNode
      notDraggable
      notDroppable
      label={
        <LibraryTypeNodeLabel
          libraryType={libraryType}
          onNewLibrary={onNewLibrary}
        />
      }
    >
      {Object.entries(librariesState[libraryType]).map(
        ([libraryName, library]) => (
          <LibraryNode
            key={library.persisted.id!}
            libraryName={libraryName}
            library={library}
            onSelectLibrary={() => onSelectLibrary(libraryName)}
            selected={libraryName === selectedLibraryName}
          />
        ),
      )}
    </TreeNode>
  );
}

/**
 * LibraryEditor is a component for wegas library management
 */
export default function LibraryEditor() {
  const [message, setMessage] = React.useState<
    LibrariesCallbackMessage | undefined
  >();
  const [selectedLibraryData, setSelectedLibraryData] = React.useState<
    { libraryType: LibraryType; libraryName: string } | undefined
  >(undefined);
  const { librariesState, saveLibrary, setLibraryVisibility, removeLibrary } =
    React.useContext(librariesCTX);

  const currentLibrary = React.useMemo(() => {
    if (selectedLibraryData != null) {
      return librariesState[selectedLibraryData.libraryType][
        selectedLibraryData.libraryName
      ];
    }
  }, [librariesState, selectedLibraryData]);

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
    (libraryType: LibraryType, message: LibrariesCallbackMessage) => {
      if (message.type === 'succes') {
        setSelectedLibraryData({ libraryType, libraryName: message.message });
      } else {
        setMessage(message);
      }
    },
    [],
  );

  return (
    <ReflexContainer orientation="vertical">
      <ReflexElement flex={1}>
        <TreeView
          rootId={String(GameModel.selectCurrent().id)}
          parameters={{
            openCloseButtons: ALWAYS_OPEN_BUTTONS,
          }}
        >
          <LibraryTypeNode
            libraryType="client"
            onSelectLibrary={libraryName =>
              setSelectedLibraryData({ libraryType: 'client', libraryName })
            }
            onNewLibrary={message => onNewLibrary('client', message)}
            selectedLibraryName={
              selectedLibraryData?.libraryType === 'client'
                ? selectedLibraryData.libraryName
                : undefined
            }
          />
          <LibraryTypeNode
            libraryType="server"
            onSelectLibrary={libraryName =>
              setSelectedLibraryData({ libraryType: 'server', libraryName })
            }
            onNewLibrary={message => onNewLibrary('server', message)}
            selectedLibraryName={
              selectedLibraryData?.libraryType === 'server'
                ? selectedLibraryData.libraryName
                : undefined
            }
          />
          <LibraryTypeNode
            libraryType="style"
            onSelectLibrary={libraryName =>
              setSelectedLibraryData({ libraryType: 'style', libraryName })
            }
            onNewLibrary={message => onNewLibrary('style', message)}
            selectedLibraryName={
              selectedLibraryData?.libraryType === 'style'
                ? selectedLibraryData.libraryName
                : undefined
            }
          />
        </TreeView>
      </ReflexElement>
      <ReflexSplitter />
      <ReflexElement flex={5}>
        <Toolbar className={expandBoth}>
          <Toolbar.Header className={defaultPadding}>
            {selectedLibraryData == null || currentLibrary == null ? (
              'No library selected yet'
            ) : (
              <>
                <h2>{selectedLibraryData.libraryName}</h2>
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
                      selectedLibraryData.libraryType,
                      selectedLibraryData.libraryName,
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
            {selectedLibraryData && currentLibrary && (
              <>
                {currentLibrary.conflict ? (
                  <IconButton
                    icon="exclamation-triangle"
                    onClick={() =>
                      saveLibrary(
                        selectedLibraryData?.libraryType,
                        selectedLibraryData?.libraryName,
                        setMessage,
                      )
                    }
                  />
                ) : (
                  <IconButton
                    disabled={!currentLibrary.modified}
                    icon="save"
                    onClick={() =>
                      saveLibrary(
                        selectedLibraryData?.libraryType,
                        selectedLibraryData?.libraryName,
                        setMessage,
                      )
                    }
                  />
                )}
                <ConfirmButton
                  icon="trash"
                  onAction={success =>
                    success &&
                    removeLibrary(
                      selectedLibraryData?.libraryType,
                      selectedLibraryData?.libraryName,
                    )
                  }
                />
              </>
            )}
          </Toolbar.Header>
          <Toolbar.Content>
            {selectedLibraryData != null && (
              <SrcEditor
                fileName={computeLibraryPath(
                  selectedLibraryData?.libraryName,
                  selectedLibraryData?.libraryType,
                )}
                onSave={() =>
                  saveLibrary(
                    selectedLibraryData?.libraryType,
                    selectedLibraryData?.libraryName,
                    setMessage,
                  )
                }
              />
            )}
          </Toolbar.Content>
        </Toolbar>
      </ReflexElement>
    </ReflexContainer>
  );
}
