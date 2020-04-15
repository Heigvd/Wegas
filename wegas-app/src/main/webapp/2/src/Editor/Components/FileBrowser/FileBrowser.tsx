import * as React from 'react';
import { generateAbsolutePath, FileAPI } from '../../../API/files.api';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { FileBrowserNode, FileBrowserNodeProps } from './FileBrowserNode';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { StoreDispatch, useStore } from '../../../data/store';
import { grow } from '../../../css/classes';
import { shallowDifferent } from '../../../Components/Hooks/storeHookFactory';
import { MessageString } from '../MessageString';
import { css } from 'emotion';
import { themeVar } from '../../../Components/Theme';

const fileBrowserStyle = css({
  backgroundColor: themeVar.backgroundColor,
  paddingRight: '5px',
  borderColor: themeVar.primaryLighterColor,
  borderRadius: themeVar.borderRadius,
  borderWidth: '2px',
  borderStyle: 'inset',
});

export type FilePickingType = 'FILE' | 'FOLDER' | 'BOTH' | undefined;
export type FileType = 'directory' | 'audio' | 'video' | 'image';
export type FilterType = 'show' | 'hide' | 'grey';
export interface FileFilter {
  filterType: FilterType;
  fileType: FileType;
}

interface FileBrowserProps {
  onFileClick?: FileBrowserNodeProps['onFileClick'];
  onDelelteFile?: FileBrowserNodeProps['onDelelteFile'];
  selectedLocalPaths?: string[];
  selectedGlobalPaths?: string[];
  localDispatch?: StoreDispatch;
  pick?: FilePickingType;
  filter?: FileFilter;
  id?: string;
}

export function FileBrowser({
  onFileClick,
  onDelelteFile,
  selectedLocalPaths,
  selectedGlobalPaths,
  localDispatch,
  pick,
  filter,
  id,
}: FileBrowserProps) {
  const [rootFile, setRootFile] = React.useState<IAbstractContentDescriptor>();
  const [error, setError] = React.useState<string>('');
  const comp = React.useRef(); // Safeguard to avoid changing state when unmounted comp

  React.useEffect(() => {
    FileAPI.getFileMeta()
      .then(file => setRootFile(file))
      .catch(({ statusText }: Response) => {
        if (comp.current) {
          setRootFile(undefined);
          setError(statusText);
        }
      });
  }, []);

  return rootFile ? (
    <DefaultDndProvider>
      <div className={grow} ref={comp.current} id={id}>
        <MessageString value={error} type={'error'} duration={3000} />
        <FileBrowserNode
          defaultFile={rootFile}
          selectedLocalPaths={selectedLocalPaths}
          selectedGlobalPaths={selectedGlobalPaths}
          noBracket
          noDelete
          onFileClick={onFileClick}
          onDelelteFile={onDelelteFile}
          localDispatch={localDispatch}
          pick={pick}
          filter={filter}
          className={fileBrowserStyle}
        />
      </div>
    </DefaultDndProvider>
  ) : (
    <div>"Loading files"</div>
  );
}

export default function FileBrowserWithMeta() {
  const globalFile = useStore(
    state =>
      state.global.editing &&
      state.global.editing.type === 'File' &&
      state.global.editing.entity,
    shallowDifferent,
  );

  return (
    <ComponentWithForm>
      {({ localState, localDispatch }) => {
        return (
          <FileBrowser
            selectedGlobalPaths={
              globalFile ? [generateAbsolutePath(globalFile)] : []
            }
            selectedLocalPaths={
              localState && localState.type === 'File'
                ? [generateAbsolutePath(localState.entity)]
                : []
            }
            localDispatch={localDispatch}
          />
        );
      }}
    </ComponentWithForm>
  );
}
