import * as React from 'react';
import { Modal } from '../../../../../Components/Modal';
import { IconButton } from '../../../../../Components/Button/IconButton';
import { FileAPI, generateAbsolutePath } from '../../../../../API/files.api';
import { wlog } from '../../../../../Helper/wegaslog';

const onNewDirectoryAccept = (
  newDirName: string,
  parentDir: IFileDescriptor,
  onAction: (newDir?: IFileDescriptor) => void,
) => {
  if (newDirName) {
    FileAPI.createFile(newDirName, generateAbsolutePath(parentDir))
      .then(file => {
        onAction(file);
      })
      .catch((res: Response) => {
        wlog(res.status, res.statusText);
        onAction();
      });
  } else {
    onAction();
  }
};

interface FileNameModalProps {
  /**
   * targetDir - The directory in wich you want to add the new file
   */
  targetDir: IFileDescriptor;
  /**
   * onAction - Called after modal action execution
   * If newDir is undefined, the user choose to cancel or something went wrong with the API
   */
  onAction: (newDir?: IFileDescriptor) => void;
}

export function FileNameModal(props: FileNameModalProps) {
  const dirName = React.useRef('');

  return (
    <Modal onExit={props.onAction}>
      <div>Please enter the name of the new directory</div>
      <div>
        <input
          placeholder="Directory name"
          type="search"
          onChange={({ target }) => (dirName.current = target.value)}
        />
      </div>
      <div>
        <IconButton
          icon={'thumbs-up'}
          label={'Accept'}
          onClick={() =>
            onNewDirectoryAccept(
              dirName.current,
              props.targetDir,
              props.onAction,
            )
          }
        />
        <IconButton
          icon={'times'}
          label={'Cancel'}
          onClick={() => props.onAction()}
        />
      </div>
    </Modal>
  );
}
