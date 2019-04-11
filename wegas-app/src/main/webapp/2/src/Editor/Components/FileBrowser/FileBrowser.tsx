import * as React from 'react';
import { FileAPI } from '../../../API/files.api';
import { GameModel } from '../../../data/selectors';
import { NativeTypes } from 'react-dnd-html5-backend';
import {
  hiddenFileBrowserStyle,
  DropTargetFileRow,
  DropTargetAddFileRow,
  DndFileRowProps,
  DndAddFileRowProps,
} from './FileBrowserRow';
import { DropTargetMonitor } from 'react-dnd';
import { IFile, IFiles } from '../../../../types/IFile';
import { defaultContextManager } from '../../../Components/DragAndDrop';

export interface FileBrowserProps {
  getSelectedFiles?: (files: string[]) => void;
}

export function FileBrowser(props: FileBrowserProps) {
  const [currentPath, setCurrentPath] = React.useState('/');
  const [files, setFiles] = React.useState<IFiles>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [refreshToggle, setRefreshToggle] = React.useState(false);

  const generateGoodPath = (file: IFile) => {
    return file.path.replace(/(\/)$/, '') + '/' + file.name;
  };

  const onSelect = (file: IFile, selected: boolean) => {
    (selectedFiles: string[]) => {
      const key: string = file.path + file.name;
      const index: number = selectedFiles.indexOf(key);
      const newSF = selected
        ? [...selectedFiles, key]
        : [...selectedFiles.slice(0, index), ...selectedFiles.slice(index + 1)];
      setSelectedFiles(newSF);
      if (props.getSelectedFiles) {
        props.getSelectedFiles(selectedFiles);
      }
    };
  };

  const onClick = (file: IFile) => {
    if (file.directory) {
      setCurrentPath(generateGoodPath(file));
    }
  };

  const onBack = () => {
    (currentPath: string) => {
      let newPath = currentPath.replace(/\/(?:.(?!\/))+$/, '');
      newPath = newPath === '' ? '/' : newPath;
      setCurrentPath(newPath);
    };
  };

  const refreshFileList = () => {
    FileAPI.getFileList(GameModel.selectCurrent().id!, currentPath).then(
      (res: IFiles) => {
        setFiles(res);
      },
    );
  };

  const refresh = () => {
    setRefreshToggle(!refreshToggle);
  };

  const addNewDirectory = () => {
    const newDirName = prompt('Please enter the name of the new directory', '');

    FileAPI.createFile(
      GameModel.selectCurrent().id!,
      newDirName!,
      currentPath,
    ).then(() => {
      refresh();
    });
  };

  const clickNewFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    document.getElementById('newfile-upload')!.click();
  };

  const uploadFiles = (files: FileList, path: string = currentPath) => {
    for (let i = 0; i < files.length; i += 1) {
      FileAPI.createFile(
        GameModel.selectCurrent().id!,
        files[i].name,
        path,
        files[i],
      ).then(() => {
        refresh();
      });
    }
  };

  const uploadFilesFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      uploadFiles(event.target.files);
    }
  };

  React.useEffect(() => {
    refreshFileList();
  }, [props, currentPath, refreshToggle]);

  ///////////////////////////
  // Drag and drop management
  const { FILE } = NativeTypes;
  const accepts = React.useMemo(() => [FILE], []);
  const handleFileDrop = (
    item: DndFileRowProps,
    monitor: DropTargetMonitor,
  ) => {
    if (monitor) {
      if (item.file && item.file.directory) {
        uploadFiles(monitor.getItem().files, generateGoodPath(item.file));
        onClick(item.file);
      } else {
        uploadFiles(monitor.getItem().files);
      }
    }
  };
  const handleAddFileDrop = (
    item: DndAddFileRowProps,
    monitor: DropTargetMonitor,
  ) => {
    if (monitor) {
      uploadFiles(monitor.getItem().files);
    }
  };
  // Drag and drop management
  ///////////////////////////

  return (
    <div>
      <h2>{currentPath}</h2>
      {currentPath !== '/' && <button onClick={onBack}>Back</button>}
      <button onClick={addNewDirectory}>New directory</button>
      {/* <button onClick={clickNewFile}>Upload file(s)</button> */}
      <input
        id="newfile-upload"
        type="file"
        name="file"
        multiple={true}
        onChange={uploadFilesFromEvent}
        className={hiddenFileBrowserStyle}
      />
      <table>
        <tbody>
          {
            <DropTargetAddFileRow
              accepts={accepts}
              onDrop={handleAddFileDrop}
              onClick={clickNewFile}
            />
          }
          {files.map((file: IFile) => {
            const selected =
              selectedFiles.indexOf(file.path + file.name) !== -1;
            return (
              <DropTargetFileRow
                key={file.path + file.name}
                accepts={accepts}
                onDrop={handleFileDrop}
                file={file}
                onClick={onClick}
                onSelect={onSelect}
                callRefresh={refresh}
                selected={selected}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const DndFileBrowser = defaultContextManager<
  React.ComponentType<FileBrowserProps>
>(FileBrowser);
