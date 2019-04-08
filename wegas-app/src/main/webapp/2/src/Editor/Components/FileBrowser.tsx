import * as React from "react";
import { FileAPI, Files, ApiFile } from "../../API/files.api";
import { GameModel } from "../../data/selectors";
import { css } from "emotion";
import { FontAwesome } from "./Views/FontAwesome";

const rowCell = css({
  borderWidth: "1pt",
  borderStyle: "Solid"
});

const hiddenFileBrowserStyle = css({
  visibility: "hidden",
  width: 0,
  height: 0,
  position: "absolute"
});

export interface FileBrowserProps {
  onClick: (file: ApiFile) => void;
}

interface FileRowProps extends React.Component {
  file: ApiFile;
  onClick: (file: ApiFile) => void;
  onSelect: (file: ApiFile, toggle: boolean) => void;
  callRefresh: () => void;
  selected: boolean;
}

function FileRow(props: FileRowProps) {
  const [selected, setSelected] = React.useState(props.selected);
  const [absoluteFileName, setAbsoluteFileName] = React.useState("");
  const click = () => {
    props.onClick(props.file);
  };
  const select = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(!selected);
    props.onSelect(props.file, !selected);
  };
  const watch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const win = window.open(
      `/Wegas/rest/GameModel/${
        GameModel.selectCurrent().id
      }/File/read${absoluteFileName}`,
      "_blank"
    );
    win!.focus();
  };

  const del = (e: React.MouseEvent) => {
    e.stopPropagation();
    FileAPI.deleteFile(GameModel.selectCurrent().id!, absoluteFileName)
      .then((res: ApiFile) => {
        console.log(res);
      })
      .then(() => {
        props.callRefresh();
      });
  };

  // https://stackoverflow.com/questions/8595389/programmatically-trigger-select-file-dialog-box
  const clickEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.currentTarget.getElementsByTagName("input")[0].click();
  };

  const edit = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.target.files !== null && event.target.files[0]) {
      FileAPI.createFile(
        GameModel.selectCurrent().id!,
        props.file.name,
        props.file.path,
        event.target.files[0],
        true
      ).then(() => {
        props.callRefresh();
      });
    }
  };

  React.useEffect(() => {
    setSelected(props.selected);
    let filePath = props.file.path;
    if (filePath.substr(-1, 1) === "/") {
      filePath = filePath.substr(0, filePath.length - 1);
    }
    filePath += "/" + props.file.name;
    setAbsoluteFileName(filePath);
  }, [props]);

  return (
    <tr onClick={click}>
      <td className={rowCell} onClick={select}>
        <FontAwesome icon={selected ? "check-square" : "square"} />
      </td>
      <td className={rowCell}>
        <FontAwesome icon={props.file.directory ? "folder" : "file"} />
      </td>
      <td className={rowCell}>{props.file.name}</td>
      <td className={rowCell}>{props.file.bytes}</td>
      <td className={rowCell}>{props.file.mimeType}</td>
      <td className={rowCell} onClick={del}>
        <FontAwesome icon="trash" />
      </td>
      {!props.file.directory && (
        <td className={rowCell} onClick={clickEdit}>
          <FontAwesome icon="edit" />
          <input
            type="file"
            onChange={edit}
            className={hiddenFileBrowserStyle}
          />
        </td>
      )}
      {!props.file.directory && (
        <td className={rowCell} onClick={watch}>
          <FontAwesome icon="search" />
        </td>
      )}
    </tr>
  );
}

export default function FileBrowser(props?: FileBrowserProps) {
  const [currentPath, setCurrentPath] = React.useState("/");
  const [files, setFiles] = React.useState(new Array());
  const [selectedFiles, setSelectedFiles] = React.useState(new Array<string>());
  const [refreshToggle, setRefreshToggle] = React.useState(false);

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
      setCurrentPath(file.path.replace(/(\/)$/, "") + "/" + file.name);
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

  const uploadFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      for (let i = 0; i < event.target.files.length; i += 1) {
        FileAPI.createFile(
          GameModel.selectCurrent().id!,
          event.target.files[i].name,
          currentPath,
          event.target.files[i]
        ).then(() => {
          refresh();
        });
      }
    }
  };

  React.useEffect(() => {
    refreshFileList();
  }, [props, currentPath, refreshToggle]);

  return (
    <div>
      <h2>{currentPath}</h2>
      {currentPath !== "/" && <button onClick={onBack}>Back</button>}
      <button onClick={addNewDirectory}>New directory</button>
      <button onClick={clickNewFile}>Upload file(s)</button>
      <input
        id="newfile-upload"
        type="file"
        name="file"
        multiple={true}
        onChange={uploadFiles}
        className={hiddenFileBrowserStyle}
      />
      <table>
        <tbody>
          {files.map((file: ApiFile) => {
            const selected =
              selectedFiles.indexOf(file.path + file.name) !== -1;
            return (
              <FileRow
                key={currentPath + file.name}
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
