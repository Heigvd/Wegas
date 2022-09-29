import { css, cx } from '@emotion/css';
import {
  faBug,
  faFolder,
  faFolderOpen,
} from '@fortawesome/free-solid-svg-icons/';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

function normalizeFilename(path: string): string {
  return path
    .split(/\/+/)
    .filter(x => x)
    .join('/');
}

const unsaved = css({
  fontWeight: 'bolder',
});

const conflict = css({
  color: 'var(--colors-errorcolor)',
});

const addLibButtonStyle = css({
  padding: '10px',
});

interface CreateLibButtonProps {
  className?: string;
  label?: string;
  libraryType: LibraryType;
  onNewLibrary: (message: LibrariesCallbackMessage) => void;
  basePath?: string;
}

function CreateLibButton({
  className,
  libraryType,
  onNewLibrary,
  basePath,
  label,
}: CreateLibButtonProps) {
  const [editState, setEditState] = React.useState(false);
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const { addLibrary } = React.useContext(librariesCTX);

  return (
    <div className={cx(flex, flexBetween, className)}>
      {!editState ? (
        <Button label={label} icon="plus" onClick={() => setEditState(true)} />
      ) : (
        <>
          <TextPrompt
            placeholder={i18nValues.scripts.libraryName}
            defaultFocus
            onAction={(success, value) => {
              if (success) {
                if (value !== '') {
                  addLibrary(
                    libraryType,
                    normalizeFilename((basePath || '') + '/' + value),
                    onNewLibrary,
                  );
                  setEditState(false);
                }
              } else {
                setEditState(false);
              }
            }}
            onBlur={() => setEditState(false)}
            applyOnEnter
          />
        </>
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

interface CustomLibraryEditorPropsView {
  libraryType?: LibraryType;
  libraryIndex: Record<string, LibraryWithStatus>;
}

interface FileProps {
  type: 'File';
  fullPath: string;
  file: LibraryWithStatus;
  selectLibrary: (libName: string) => void;
  selectedLib: string;
}

function File({ file, selectedLib, selectLibrary }: FileProps): JSX.Element {
  const label = file.label
    .split('/')
    .filter(x => x)
    .slice(-1)[0];

  return (
    <TreeNode
      notDraggable
      notDroppable
      label={
        <div
          onClick={() => {
            selectLibrary(file.monacoPath);
          }}
          className={cx(
            labelStyle,
            flex,
            //flexBetween,
            cx({
              [globalSelection]: selectedLib === file.monacoPath,
              [unsaved]: file.modified,
              [conflict]: file.conflict,
            }),
          )}
        >
          {file.execError && (
            <FontAwesomeIcon
              className={css({
                paddingRight: '0.5ex',
              })}
              icon={faBug}
              title={file.execError}
            />
          )}
          {label}
          {file.modified && ' [unsaved]'}
          {file.conflict && ' [outdated]'}
        </div>
      }
    />
  );
}

interface FolderProps {
  type: 'Folder';
  fullPath: string;
  entries: (FileProps | FolderProps)[];
  selectLibrary: (libName: string) => void;
  selectedLib: string;
  libType: LibraryType | null;
  setMessage: SetMessageFn;
}

type SetMessageFn = React.Dispatch<
  React.SetStateAction<LibrariesCallbackMessage>
>;

function Folder({
  fullPath,
  entries,
  libType,
  selectLibrary,
  setMessage,
}: FolderProps): JSX.Element {
  const label = fullPath
    .split('/')
    .filter(x => x)
    .splice(-1)[0];

  return (
    <TreeNode
      notDraggable
      notDroppable
      label={open => (
        <div className={css({ display: 'flex', alignItems: 'center' })}>
          <FontAwesomeIcon icon={open ? faFolderOpen : faFolder} />
          <div className={css({ paddingLeft: '1ex' })}>{label} </div>
          {libType && (
            <CreateLibButton
              libraryType={libType}
              basePath={fullPath}
              onNewLibrary={message => {
                if (message.type === 'succes') {
                  selectLibrary(message.message);
                } else {
                  setMessage(message);
                }
              }}
            />
          )}
        </div>
      )}
    >
      {entries.map(entry => {
        if (entry.type === 'File') {
          return <File key={entry.fullPath} {...entry} />;
        } else {
          return <Folder key={entry.fullPath} {...entry} />;
        }
      })}
    </TreeNode>
  );
}

function buildTree(
  currentPath: string,
  entries: LibraryWithStatus[],
  selectedLib: string,
  selectLib: (name: string) => void,
  setMessage: SetMessageFn,
  libType: LibraryType | undefined | null,
): FolderProps {
  const folders: Record<string, LibraryWithStatus[]> = {};
  const files: FileProps[] = [];

  entries.forEach(item => {
    const fullPath = item.label;
    const path = fullPath.replace(currentPath || '', '');

    const segments = path.split('/').filter(x => x);

    if (segments.length > 1) {
      // Folder
      const folderName = segments[0];

      if (folders[folderName] == null) {
        folders[folderName] = [];
      }
      folders[folderName].push(item);
    } else {
      // File
      files.push({
        type: 'File',
        file: item,
        fullPath: fullPath,
        selectLibrary: selectLib,
        selectedLib: selectedLib,
      });
    }
  });

  const f = Object.entries(folders).map(([path, list]) => {
    return buildTree(
      (currentPath ? currentPath + '/' : currentPath) + path,
      list,
      selectedLib,
      selectLib,
      setMessage,
      libType,
    );
  });

  let eLib = libType;
  if (eLib === undefined) {
    if (currentPath.startsWith('clientInternal')) {
      eLib = null;
    } else if (currentPath.startsWith('client')) {
      eLib = 'client';
    } else if (currentPath.startsWith('server')) {
      eLib = 'server';
    } else if (currentPath.startsWith('style')) {
      eLib = 'style';
    }
  }

  return {
    type: 'Folder',
    fullPath: currentPath,
    entries: [
      ...f.sort((a, b) => a.fullPath.localeCompare(b.fullPath)),
      ...files.sort((a, b) => a.fullPath.localeCompare(b.fullPath)),
    ],
    selectedLib: selectedLib,
    selectLibrary: selectLib,
    libType: eLib || null,
    setMessage,
  };
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

  const readOnly = currentLibrary == null || currentLibrary.readOnly;

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
    if (currentLibrary && !currentLibrary.readOnly) {
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

        // move cursor to the targeted position
        // Delay this operation slightly, so that React can render the component
        setTimeout(() => {
          editor.setSelection(codeLocation.options.selection);
          editor.revealLineInCenter(
            codeLocation.options.selection.startLineNumber,
          );
        }, 0);
      }
    },
    [libraryIndex],
  );

  const tree = buildTree(
    '',
    Object.values(libraryIndex),
    selectedLibraryName || '',
    setSelectedLibraryName,
    setMessage,
    libraryType,
  );
  const nodes = tree.entries.map(entry => {
    if (entry.type === 'File') {
      return <File key={entry.fullPath} {...entry} />;
    } else {
      return <Folder key={entry.fullPath} {...entry} />;
    }
  });

  return (
    <ReflexContainer orientation="vertical">
      <ReflexElement
        flex={currentLibrary == null ? 5 : 1}
        className={cx(flex, flexColumn)}
      >
        {libraryType ? (
          <CreateLibButton
            className={addLibButtonStyle}
            libraryType={libraryType}
            onNewLibrary={onNewLibrary}
            label={`New ${libraryType} library`}
          />
        ) : (
          <>
            <CreateLibButton
              className={addLibButtonStyle}
              libraryType="client"
              label={`New client library`}
              onNewLibrary={onNewLibrary}
            />
            <CreateLibButton
              className={addLibButtonStyle}
              libraryType="server"
              label={`New server library`}
              onNewLibrary={onNewLibrary}
            />
            <CreateLibButton
              className={addLibButtonStyle}
              libraryType="style"
              label={`New stylesheet`}
              onNewLibrary={onNewLibrary}
            />
          </>
        )}
          <MessageString
            type={ message?.type || 'normal'}
            value={message?.message || ''}
            duration={5000}
            onLabelVanish={() => setMessage(undefined)}
          />
        <TreeView rootId={String(GameModel.selectCurrent().id)}>
          {nodes}
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
                    readOnly={readOnly}
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
