import * as React from 'react';
import { css, cx } from 'emotion';
import { generateAbsolutePath, FileAPI } from '../../../API/files.api';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { AsyncVariableForm } from '../EntityEditor';
import getEditionConfig from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../FormView';
import { DefaultDndProvider } from '../../../Components/DefaultDndProvider';
import { FileBrowserNode } from './FileBrowserNode';
import { StyledLabel } from '../../../Components/AutoImport/String/Label';

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
});

interface FileBrowserProps {
  onFileClick?: (
    file: IFileDescriptor,
    onFileUpdate?: (updatedFile: IFileDescriptor) => void,
  ) => void;
  onDelelteFile?: (deletedFile: IFileDescriptor) => void;
  selectedPaths?: string[];
}

export function FileBrowser({
  onFileClick,
  onDelelteFile,
  selectedPaths,
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

  return (
    <DefaultDndProvider>
      <div className={grow}>
        <StyledLabel value={error} type={'error'} duration={3000} />
        {rootFile ? (
          <FileBrowserNode
            currentFile={rootFile}
            selectedPaths={selectedPaths}
            noBracket
            noDelete
            onFileClick={onFileClick}
            onDelelteFile={onDelelteFile}
          />
        ) : (
          <div>"Loading root file"</div>
        )}
      </div>
    </DefaultDndProvider>
  );
}

export function FileBrowserWithMeta() {
  const [selectedFile, setSelectedFile] = React.useState<IFileDescriptor>();
  const [error, setError] = React.useState<string>('');
  const fileUpdate = React.useRef<(updatedFile: IFileDescriptor) => void>(
    () => {},
  );

  const onFileClick = (
    file: IFileDescriptor,
    onFileUpdate?: (updatedFile: IFileDescriptor) => void,
  ) => {
    setSelectedFile(oldSelectedFile => {
      if (
        !oldSelectedFile ||
        generateAbsolutePath(file) !== generateAbsolutePath(oldSelectedFile)
      ) {
        if (onFileUpdate) {
          fileUpdate.current = onFileUpdate;
        }
        return file;
      }
      return undefined;
    });
  };

  const saveMeta = (file: IFileDescriptor) => {
    FileAPI.updateMetadata(file)
      .then((resFile: IFileDescriptor) => {
        fileUpdate.current(resFile);
        setSelectedFile(file);
      })
      .catch(({ statusText }: Response) => setError(statusText));
  };

  return (
    <div className={cx(flex, grow)}>
      <ReflexContainer orientation={'vertical'}>
        <ReflexElement>
          <FileBrowser
            onFileClick={onFileClick}
            onDelelteFile={file => {
              if (
                selectedFile &&
                generateAbsolutePath(selectedFile).startsWith(
                  generateAbsolutePath(file),
                )
              ) {
                setSelectedFile(undefined);
              }
            }}
            selectedPaths={
              selectedFile ? [generateAbsolutePath(selectedFile)] : []
            }
          />
        </ReflexElement>
        {selectedFile && <ReflexSplitter />}
        {selectedFile && (
          <ReflexElement>
            <StyledLabel value={error} type={'error'} duration={3000} />
            <div className={cx(flex, grow)}>
              <AsyncVariableForm
                getConfig={entity =>
                  getEditionConfig(entity) as Promise<Schema<AvailableViews>>
                }
                update={saveMeta}
                entity={selectedFile}
              />
            </div>
          </ReflexElement>
        )}
      </ReflexContainer>
    </div>
  );
}
