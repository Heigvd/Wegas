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
  getAbsoluteFileName,
} from './FileBrowserRow';
import { DropTargetMonitor } from 'react-dnd';
import { defaultContextManager } from '../../../Components/DragAndDrop';
import { FontAwesome } from '../Views/FontAwesome';
import { omit } from 'lodash-es';

export interface FileBrowserProps {
  onSelectFile?: (files: IFile[]) => void;
  multipleSelection?: boolean;
}

export type IFileMap = { [key: string]: IFile };

export const gameModelDependsOnModel = () => {
  return (
    GameModel.selectCurrent().type === 'SCENARIO' &&
    GameModel.selectCurrent().basedOnId !== null
  );
};

export function FileBrowser(props: FileBrowserProps) {
  const [currentPath, setCurrentPath] = React.useState('/');
  const [files, setFiles] = React.useState<IFile[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<IFileMap>({});
  const [refreshToggle, setRefreshToggle] = React.useState(false);
  const [isUploading, setUploading] = React.useState(false);
  const [uploadAllowed, setUploadAllowed] = React.useState(false);

  const generateGoodPath = (file: IFile) => {
    return file.path.replace(/(\/)$/, '') + '/' + file.name;
  };

  const onSelect = (file: IFile, selected: boolean) => {
    // If multipleSelection is defined or true, selected files are saved
    setSelectedFiles(selectedFiles => {
      const key: string = generateGoodPath(file);
      let newSF: IFileMap = props.multipleSelection ? selectedFiles : {};
      if (selected) {
        newSF[key] = file;
      } else {
        newSF = omit(selectedFiles, key);
      }
      if (props.onSelectFile) {
        props.onSelectFile(Object.values(newSF));
      }
      return newSF;
    });
  };

  const onOpen = (file: IFile) => {
    console.log('onClick');
    if (file.directory) {
      // Open directory
      setCurrentPath(generateGoodPath(file));
    } else {
      // Open file
      const win = window.open(
        FileAPI.fileURL(
          GameModel.selectCurrent().id!,
          getAbsoluteFileName(file),
        ),
        '_blank',
      );
      win!.focus();
    }
  };

  const onBack = () => {
    setCurrentPath(currentPath => {
      let newPath = currentPath.replace(/\/(?:.(?!\/))+$/, '');
      newPath = newPath === '' ? '/' : newPath;
      return newPath;
    });
  };

  const refreshFileList = () => {
    return FileAPI.getFileList(GameModel.selectCurrent().id!, currentPath).then(
      (res: IFile[]) => {
        setFiles(res);
      },
    );
  };

  const refresh = () => {
    setRefreshToggle(refreshToggle => !refreshToggle);
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
    setUploading(true);
    for (let i = 0; i < files.length; i += 1) {
      FileAPI.createFile(
        GameModel.selectCurrent().id!,
        files[i].name,
        path,
        files[i],
      ).then(() => {
        refresh();
        setUploading(false);
      });
    }
  };

  const uploadFilesFromEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event);
    if (event.target.files !== null) {
      uploadFiles(event.target.files);
    }
  };

  React.useEffect(() => {
    refreshFileList();
    isUploadAllowed().then((allowed: boolean) => {
      setUploadAllowed(allowed);
    });
  }, [props, currentPath, refreshToggle, isUploading]);

  ///////////////////////////
  // Drag and drop management
  // Make sure you always set accept variable to avoid catching other DnD draggable objects
  const { FILE } = NativeTypes;
  const accepts = React.useMemo(() => [FILE], []); // Accept only files
  const handleFileDrop = (
    item: DndFileRowProps,
    monitor: DropTargetMonitor,
  ) => {
    if (monitor) {
      // If insertion in directory, open directory after upload
      if (item.file && item.file.directory) {
        uploadFiles(monitor.getItem().files, generateGoodPath(item.file));
        onOpen(item.file);
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

  const isUploadAllowed = () => {
    return FileAPI.getFileMeta(GameModel.selectCurrent().id!, currentPath).then(
      (file: IFile) => {
        return (
          !gameModelDependsOnModel() ||
          file.visibility === 'PRIVATE' ||
          file.visibility === 'INHERITED'
        );
      },
    );
  };

  return (
    <div>
      <h2>{currentPath}</h2>
      {currentPath !== '/' && (
        <button onClick={onBack}>
          <FontAwesome icon="arrow-left" />
        </button>
      )}
      {uploadAllowed && (
        <button onClick={addNewDirectory}>
          <FontAwesome icon="folder-plus" />
        </button>
      )}
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
          {uploadAllowed && (
            <DropTargetAddFileRow
              accepts={accepts}
              onDrop={handleAddFileDrop}
              onClick={clickNewFile}
              isUploading={isUploading}
            />
          )}
          {files.map((file: IFile) => {
            const selected =
              selectedFiles[getAbsoluteFileName(file)] !== undefined;

            console.log(file.name + ' : selected -> ' + selected);
            return (
              <DropTargetFileRow
                key={file.path + file.name}
                accepts={accepts}
                onDrop={handleFileDrop}
                file={file}
                onOpen={onOpen}
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
