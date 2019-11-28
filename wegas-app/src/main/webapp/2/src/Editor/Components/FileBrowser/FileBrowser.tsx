import * as React from 'react';
import { generateAbsolutePath, FileAPI } from '../../../API/files.api';
import { DefaultDndProvider } from '../../../Components/Contexts/DefaultDndProvider';
import { FileBrowserNode, FileBrowserNodeProps } from './FileBrowserNode';
import { StyledLabel } from '../../../Components/AutoImport/String/String';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { StoreDispatch, useStore } from '../../../data/store';
import { grow } from '../../../css/classes';
import { shallowDifferent } from '../../../data/connectStore';

interface FileBrowserProps {
  onFileClick?: FileBrowserNodeProps['onFileClick'];
  onDelelteFile?: FileBrowserNodeProps['onDelelteFile'];
  selectedLocalPaths?: string[];
  selectedGlobalPaths?: string[];
  localDispatch?: StoreDispatch;
}

export function FileBrowser({
  onFileClick,
  onDelelteFile,
  selectedLocalPaths,
  selectedGlobalPaths,
  localDispatch,
}: FileBrowserProps) {
  const [rootFile, setRootFile] = React.useState<IAbstractContentDescriptor>();
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    FileAPI.getFileMeta()
      .then(file => setRootFile(file))
      .catch(({ statusText }: Response) => {
        setRootFile(undefined);
        setError(statusText);
      });
  }, []);

  return rootFile ? (
    <DefaultDndProvider>
      <div className={grow}>
        <StyledLabel value={error} type={'error'} duration={3000} />
        <FileBrowserNode
          defaultFile={rootFile}
          selectedLocalPaths={selectedLocalPaths}
          selectedGlobalPaths={selectedGlobalPaths}
          noBracket
          noDelete
          onFileClick={onFileClick}
          onDelelteFile={onDelelteFile}
          localDispatch={localDispatch}
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
