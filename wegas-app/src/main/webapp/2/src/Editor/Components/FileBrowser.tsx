import * as React from "react";
import {FileAPI, Files, ApiFile} from '../../API/files.api'
import { GameModel } from "../../data/selectors";
import { css } from "emotion";
import { FontAwesome } from "./Views/FontAwesome";

const row = css({
    borderWidth: "1pt",
    borderStyle: "Solid",
  });

  const clickedRow = css({
    backgroundColor: "lightblue"
  });

export interface FileBrowserProps {
    onClick: (file : ApiFile) => void;
}

interface FileRowProps {
    file: ApiFile;
    onClick: (file : ApiFile) => void;
    onSelect: (file : ApiFile, toggle : boolean) => void;
    selected: boolean;
}

function FileRow(props : FileRowProps){
    const [selected, setSelected] = React.useState(props.selected);
    console.log("Row " + props.selected + "|" + selected);
    const click = () => {
        props.onClick(props.file)
    };
    const select = (e : React.MouseEvent) => {
        e.stopPropagation();
        setSelected(!selected);
        props.onSelect(props.file,!selected);
    }

    React.useEffect(() => {
        setSelected(props.selected);
    }, [props]);

    return (
        <tr onClick={click}>
            <td className={(selected ? clickedRow : undefined) + " " + row} onClick={select}><FontAwesome icon={props.file.directory ? 'folder' : 'file'}/></td>
            <td className={row}>{props.file.name}</td>
            <td className={row}>{props.file.bytes}</td>
            <td className={row}>{props.file.mimeType}</td>
            <td className={row}><FontAwesome icon='trash'/></td>
        </tr>
    );
}

export default function FileBrowser(props? : FileBrowserProps) {
    console.log("FileBrowser");
    const [currentPath , setCurrentPath] = React.useState('/');
    const [files , setFiles] = React.useState(new Array());
    const [selectedFiles, setSelectedFiles] = React.useState(new Array<string>());
    const [dirName, setDirName] = React.useState("");
    const [refreshToggle, setRefreshToggle] = React.useState(false);

    const onSelect = (file: ApiFile, selected: boolean) => {
        const key : string = (file.path + file.name);
        const index : number = selectedFiles.indexOf(key);
        console.log(file.path + file.name);
        if(selected){
            setSelectedFiles( [...selectedFiles,key]);
        }
        else{
            const newSF = [...selectedFiles];
            newSF.splice(index,1);    
            setSelectedFiles(newSF);
        }
    }

    const onClick = (file: ApiFile) => {
        if(props){
            props.onClick(file);
        }
        if(file.directory){
            setCurrentPath(file.path.replace(/(\/)$/,"") + '/' + file.name);
        }
    }

    const onBack = () => {
        let newPath = currentPath.replace(/\/(?:.(?!\/))+$/,"");
        newPath = newPath === "" ? "/" : newPath;
        setCurrentPath(newPath);
    }

    const refreshFileList = () => {
        FileAPI.getFileList(GameModel.selectCurrent().id!,currentPath).then((res : Files) => {
            setFiles(res);
        });
    }

    const refresh = () => {
        setRefreshToggle(!refreshToggle);
    }

    const addNewDirectory = () => {
        FileAPI.createFile(GameModel.selectCurrent().id!, dirName, currentPath);
        refresh();
    }

    React.useEffect(() => {
        refreshFileList();
    } , [props, currentPath, refreshToggle]);


  return (
    <div>
        <h2>{currentPath}</h2>
        {(currentPath !== "/") && <button onClick={onBack}>Back</button>}
        <input type="text" onChange={(e)=>setDirName(e.target.value)}/>
        <button onClick={addNewDirectory}>New directory</button>
        <input type="file" onClick={addNewDirectory} />
        <table>
            <tbody>
            {
                files.map((file : ApiFile) => {
                    const selected = selectedFiles.indexOf(file.path + file.name) !== -1;
                    console.log(selectedFiles);
                    console.log(currentPath + file.name);
                    return (<FileRow key={currentPath + file.name} file={file} onClick={onClick} onSelect={onSelect} selected={selected}/>);
                })
            }
            </tbody>
        </table>
    </div>
    );
}