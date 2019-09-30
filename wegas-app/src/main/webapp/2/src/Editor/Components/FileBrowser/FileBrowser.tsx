import * as React from 'react';
import { css, cx } from 'emotion';
import { generateAbsolutePath, FileAPI } from '../../../API/files.api';
import { AsyncVariableForm } from '../EntityEditor';
import getEditionConfig from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../FormView';
import { DefaultDndProvider } from '../../../Components/DefaultDndProvider';
import { FileBrowserNode, FileBrowserNodeProps } from './FileBrowserNode';
import { StyledLabel } from '../../../Components/AutoImport/String/Label';
import { useStore, getDispatch } from '../../../data/store';
import { editFile, closeEditor } from '../../../data/Reducer/globalState';
import { shallowIs } from '../../../Helper/shallowIs';
import { focusTabContext } from '../LinearTabLayout/LinearLayout';
import { layoutTabs } from '../Layout';

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
});
const growBig = css({
  flex: '30 1 auto',
});

interface FileBrowserProps {
  onFileClick?: FileBrowserNodeProps['onFileClick'];
  onDelelteFile?: FileBrowserNodeProps['onDelelteFile'];
  selectedLocalPaths?: string[];
  selectedGlobalPaths?: string[];
}

export function FileBrowser({
  onFileClick,
  onDelelteFile,
  selectedLocalPaths,
  selectedGlobalPaths,
}: FileBrowserProps) {
  const [rootFile, setRootFile] = React.useState<IFileDescriptor>();
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
        />
      </div>
    </DefaultDndProvider>
  ) : (
    <div>"Loading files"</div>
  );
}

export default function FileBrowserWithMeta() {
  const [localSelectedFile, setLocalSelectedFile] = React.useState<
    IFileDescriptor
  >();
  const [error, setError] = React.useState<string>('');
  const fileUpdate = React.useRef<(updatedFile: IFileDescriptor) => void>(
    () => {},
  );
  const editing = useStore(
    state => state.global.editing,
    (a, b) => !shallowIs(a, b),
  );
  const dispatch = getDispatch();
  const focusTab = React.useContext(focusTabContext);

  const onFileClick: FileBrowserProps['onFileClick'] = (
    event,
    file,
    onFileUpdate,
  ) => {
    fileUpdate.current = onFileUpdate ? onFileUpdate : () => {};
    if (event && event.ctrlKey) {
      setLocalSelectedFile(oldSelectedFile => {
        if (
          !oldSelectedFile ||
          generateAbsolutePath(file) !== generateAbsolutePath(oldSelectedFile)
        ) {
          return file;
        }
        return undefined;
      });
    } else {
      if (
        editing &&
        editing.type === 'File' &&
        generateAbsolutePath(editing.entity) === generateAbsolutePath(file)
      ) {
        dispatch(closeEditor());
      } else {
        focusTab(layoutTabs.EntityEditor);
        dispatch(editFile(file, { save: saveMeta }));
      }

      return undefined;
    }
  };

  const onDeleteFile: FileBrowserProps['onDelelteFile'] = file => {
    if (
      localSelectedFile &&
      generateAbsolutePath(localSelectedFile).startsWith(
        generateAbsolutePath(file),
      )
    ) {
      setLocalSelectedFile(undefined);
      dispatch(closeEditor());
    }
  };

  const saveMeta = (file: IFileDescriptor) => {
    FileAPI.updateMetadata(file)
      .then((resFile: IFileDescriptor) => {
        fileUpdate.current(resFile);
        setLocalSelectedFile(oldSelected => {
          if (
            oldSelected &&
            generateAbsolutePath(oldSelected) === generateAbsolutePath(resFile)
          ) {
            return resFile;
          }
        });
        dispatch(editFile(resFile));
      })
      .catch(({ statusText }: Response) => setError(statusText));
  };

  return (
    <div className={cx(flex, grow)}>
      <div className={cx(flex, growBig)}>
        <FileBrowser
          onFileClick={onFileClick}
          onDelelteFile={onDeleteFile}
          selectedLocalPaths={
            localSelectedFile ? [generateAbsolutePath(localSelectedFile)] : []
          }
          selectedGlobalPaths={
            editing && editing.type === 'File'
              ? [generateAbsolutePath(editing.entity)]
              : []
          }
        />
      </div>
      {localSelectedFile && (
        <div className={cx(flex, grow)}>
          <StyledLabel
            value={error}
            type={'error'}
            duration={3000}
            onLabelVanish={() => setError('')}
          />
          <div className={cx(flex, grow)}>
            <AsyncVariableForm
              getConfig={entity =>
                getEditionConfig(entity) as Promise<Schema<AvailableViews>>
              }
              update={saveMeta}
              entity={localSelectedFile}
            />
          </div>
        </div>
      )}
    </div>
  );
}
