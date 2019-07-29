import * as React from 'react';
import { Modal } from '../../../../../Components/Modal';
import { IconButton } from '../../../../../Components/Button/IconButton';
import { FileAPI } from '../../../../../API/files.api';

interface FileNameModalProps {
  /**
   * oldFile - The file that's going to be overridden
   */
  oldFile: IFileDescriptor;
  /**
   * newFile - The file that's replace the old one
   */
  newFile: File;
  /**
   * onAction - Called after modal action execution
   * If newFile is undefined, the user choose to cancel or something went wrong with the API
   */
  onAction: (newFile?: IFileDescriptor) => void;
}

export function FileOverrideModal(props: FileNameModalProps) {
  const [overrideType, setOverrideType] = React.useState(false);
  return (
    <Modal>
      <div>
        {!overrideType
          ? `This file [${
              props.oldFile.name
            }] already exists, do you want to override
        it?`
          : `You are about to change file type from [${
              props.oldFile.mimeType
            }] to [${props.newFile.type}]. Are you sure?`}
      </div>
      <div>
        <IconButton
          icon={'thumbs-up'}
          label={'Accept'}
          onClick={() => {
            if (
              !overrideType &&
              props.oldFile.mimeType !== props.newFile.type
            ) {
              setOverrideType(true);
            } else {
              FileAPI.createFile(
                props.oldFile.name,
                props.oldFile.path,
                props.newFile,
                true,
              )
                .then(savedFile => {
                  props.onAction(savedFile);
                })
                .catch(() => props.onAction());
            }
          }}
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
