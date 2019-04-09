import * as React from "react";
import { FileAPI, Files, ApiFile } from "../../../API/files.api";
import { GameModel } from "../../../data/selectors";
import { NativeTypes } from "react-dnd-html5-backend";
import {
  hiddenFileBrowserStyle,
  DropTargetFileRow,
  DropTargetAddFileRow,
  DndFileRowProps,
  DndAddFileRowProps,
  AddFileRowProps
} from "./FileBrowserRow";
import { DropTargetMonitor } from "react-dnd";

export interface FileBrowserProps {
  onClick: (file: ApiFile) => void;
}

export function FileBrowser(props?: FileBrowserProps) {
  const [currentPath, setCurrentPath] = React.useState("/");
  const [files, setFiles] = React.useState(new Array());
  const [selectedFiles, setSelectedFiles] = React.useState(new Array<string>());
  const [refreshToggle, setRefreshToggle] = React.useState(false);

  const generateGoodPath = (file: ApiFile) => {
    return file.path.replace(/(\/)$/, "") + "/" + file.name;
  };

  const onSelect = (file: ApiFile, selected: boolean) => {
    const key: string = file.path + file.name;
    const index: number = selectedFiles.indexOf(key);
    if (selected) {
      setSelectedFiles([...selectedFiles, key]);
    } else {
      const newSF = [...selectedFiles];
      newSF.splice(index, 1);
      setSelectedFiles(newSF);
    }
  };

  const onClick = (file: ApiFile) => {
    if (props) {
      props.onClick(file);
    }
    if (file.directory) {
      setCurrentPath(generateGoodPath(file));
    }
  };

  const onBack = () => {
    let newPath = currentPath.replace(/\/(?:.(?!\/))+$/, "");
    newPath = newPath === "" ? "/" : newPath;
    setCurrentPath(newPath);
  };

  const refreshFileList = () => {
    FileAPI.getFileList(GameModel.selectCurrent().id!, currentPath).then(
      (res: Files) => {
        setFiles(res);
      }
    );
  };

  const refresh = () => {
    setRefreshToggle(!refreshToggle);
  };

  const addNewDirectory = () => {
    var newDirName = prompt("Please enter the name of the new directory", "");

    FileAPI.createFile(
      GameModel.selectCurrent().id!,
      newDirName!,
      currentPath
    ).then(() => {
      refresh();
    });
  };

  const clickNewFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    document.getElementById("newfile-upload")!.click();
  };

  const uploadFiles = (files: FileList, path: string = currentPath) => {
    for (let i = 0; i < files.length; i += 1) {
      FileAPI.createFile(
        GameModel.selectCurrent().id!,
        files[i].name,
        path,
        files[i]
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
    monitor: DropTargetMonitor
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
    monitor: DropTargetMonitor
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
      {currentPath !== "/" && <button onClick={onBack}>Back</button>}
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
          {files.map((file: ApiFile) => {
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
