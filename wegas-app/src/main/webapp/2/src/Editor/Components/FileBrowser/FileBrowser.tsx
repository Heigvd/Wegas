import * as React from 'react';
import { css } from 'emotion';
import { generateAbsolutePath, FileAPI } from '../../../API/files.api';
import { DefaultDndProvider } from '../../../Components/DefaultDndProvider';
import { FileBrowserNode, FileBrowserNodeProps } from './FileBrowserNode';
import { StyledLabel } from '../../../Components/AutoImport/String/Label';
import ComponentWithForm from '../FormView/ComponentWithForm';
import { wlog } from '../../../Helper/wegaslog';

const grow = css({
  flex: '1 1 auto',
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
  const onSaveFile = (
    file: IFileDescriptor,
    cb: (sucess: IFileDescriptor | string) => void,
  ) => {
    FileAPI.updateMetadata(file)
      .then((resFile: IFileDescriptor) => {
        cb(resFile);
      })
      .catch(({ statusText }: Response) => cb(statusText));
  };

  const onDeleteFile = (
    file: IFileDescriptor,
    cb: (sucess: IFileDescriptor | string) => void,
  ) => {
    FileAPI.deleteFile(generateAbsolutePath(file), true)
      .then(deletedFile => cb(deletedFile))
      .catch(({ statusText }: Response) => cb(statusText));
  };

  return (
    <ComponentWithForm
      onSaveAction={onSaveFile}
      onDeleteAction={onDeleteFile}
      moreEditorActions={[
        {
          label: 'Test',
          action: () => wlog('This is a test'),
        },
      ]}
    >
      {({ onClickItemHandle, mainSelectedItem, secondarySelectedItem }) => {
        return (
          <FileBrowser
            onFileClick={(event, file, onFileUpdate) =>
              onClickItemHandle(event, file, [], onFileUpdate)
            }
            selectedGlobalPaths={
              mainSelectedItem
                ? [
                    generateAbsolutePath(
                      mainSelectedItem as IAbstractContentDescriptor,
                    ),
                  ]
                : []
            }
            selectedLocalPaths={
              secondarySelectedItem
                ? [
                    generateAbsolutePath(
                      secondarySelectedItem as IAbstractContentDescriptor,
                    ),
                  ]
                : []
            }
          />
        );
      }}
    </ComponentWithForm>
  );
}
