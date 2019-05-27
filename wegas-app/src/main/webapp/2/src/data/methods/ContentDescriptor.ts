import { ActionCreator } from '../actions';
import { FileAPI } from '../../API/files.api';
import { omit } from 'lodash';
import { StoreDispatch } from '../store';

export const getAbsoluteFileName = (file: IFile) => {
  let filePath = file.path;
  if (filePath.substr(-1, 1) === '/') {
    filePath = filePath.substr(0, filePath.length - 1);
  }
  filePath += '/' + file.name;
  return filePath;
};

export const generateAbsolutePath = (path: string, filename: string) => {
  return path.replace(/(\/)$/, '') + '/' + filename;
};

export const generateGoodPath = (file: IFile) => {
  return file.path.replace(/(\/)$/, '') + '/' + file.name;
};

export const editFileAction = async (file: IFile, dispatch?: StoreDispatch) => {
  return ActionCreator.FILE_EDIT({
    file: await FileAPI.getFileMeta(generateGoodPath(file)),
    actions: {
      save: (file: IFileConfig) => {
        const cleanFile = omit(file, '@class');
        return FileAPI.updateMetadata(cleanFile).then(
          async (resFile: IFile) => {
            if (dispatch) {
              dispatch(await editFileAction(resFile));
            }
          },
        );
      },
      more: null,
    },
  });
};

export const isDirectory = (file: IFile) =>
  file.mimeType === 'application/wfs-directory';
