import * as React from 'react';
import { Modal } from '../../../../../Components/Modal';
import { IconButton } from '../../../../../Components/Button/IconButton';
import { FileAPI, generateAbsolutePath } from '../../../../../API/files.api';
import { wlog } from '../../../../../Helper/wegaslog';

interface FileDeleteModalProps {
  /**
   * targetDir - The directory in wich you want to add the new file
   */
  targetFile: IFileDescriptor;
  /**
   * onAction - Called after modal action execution
   * If newDir is undefined, the user choose to cancel or something went wrong with the API
   */
  onAction: (accepted: boolean) => void;
}

export function FileDeleteModal(props: FileDeleteModalProps) {
  const absolutePath = generateAbsolutePath(props.targetFile);
  return (
    <Modal onExit={() => props.onAction(false)}>
      <div>{`Are you sure you want to delete ${absolutePath} with all files and subdirectories?`}</div>
      <div>
        <IconButton
          icon={'thumbs-up'}
          label={'Accept'}
          onClick={() =>
            FileAPI.deleteFile(absolutePath, true)
              .then(() => props.onAction(true))
              .catch(() => {
                wlog('Force delete not accepted or failed');
                props.onAction(false);
              })
          }
        />
        <IconButton
          icon={'times'}
          label={'Cancel'}
          onClick={() => props.onAction(false)}
        />
      </div>
    </Modal>
  );
}
