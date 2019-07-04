import { ActionCreator } from '../actions';
import { FileAPI } from '../../API/files.api';
import { StoreDispatch } from '../store';

// Define Map type
export class TMap<T> {
  [key: string]: T | undefined;
}

// Insert element
export const mapAdd: <T>(map: TMap<T>, key: string, value: T) => TMap<T> = (
  map,
  key,
  value,
) => {
  const newMap = { ...map };
  newMap[key] = value;
  return newMap;
};

// Remove element
export const mapRemove: <T>(map: TMap<T>, key: string) => TMap<T> = (
  map,
  key,
) => {
  const newMap: typeof map = {};
  Object.keys(map)
    .filter(k => k !== key)
    .map(k => {
      newMap[k] = map[k];
    });
  return newMap;
};

export const getAbsoluteFileName = (file: IFileDescriptor) => {
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

export const generateGoodPath = (file: IFileDescriptor) => {
  return file.path.replace(/(\/)$/, '') + '/' + file.name;
};

export const editFileAction = (
  file: IFileDescriptor,
  dispatch?: StoreDispatch,
) => {
  return ActionCreator.FILE_EDIT({
    file: file,
    actions: {
      save: (file: IFileDescriptor) => {
        FileAPI.updateMetadata(file).then((resFile: IFileDescriptor) => {
          if (dispatch) {
            dispatch(editFileAction(resFile));
          }
        });
      },
      more: null,
    },
  });
};

export const isDirectory = (file: IFileDescriptor) =>
  file.mimeType === 'application/wfs-directory';
