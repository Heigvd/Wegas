import { IconName } from '@fortawesome/fontawesome-svg-core';
import { IAbstractContentDescriptor } from 'wegas-ts-api';

////////////////////////////////////////////////////////////////////////////////////////////////////

export function isDirectory(file: IAbstractContentDescriptor) {
  return file.mimeType.indexOf('directory') !== -1;
}

export function isFile(file: IAbstractContentDescriptor) {
  return !isDirectory(file);
}
export function isAudio(file: IAbstractContentDescriptor) {
  return file.mimeType.indexOf('audio/') !== -1;
}

export function isImage(file: IAbstractContentDescriptor) {
  return file.mimeType.indexOf('image/') !== -1;
}

export function isVideo(file: IAbstractContentDescriptor) {
  return file.mimeType.indexOf('video/') !== -1;
}

////////////////////////////////////////////////////////////////////////////////////////////////////

export function getIconForFile(
  file: IAbstractContentDescriptor,
  isOpened?: boolean,
): IconName {
  if (isDirectory(file)) {
    if (isOpened) {
      return 'folder-open';
    } else {
      return 'folder';
    }
  } else if (isAudio(file)) {
    return 'file-audio';
  } else if (isVideo(file)) {
    return 'file-video';
  } else if (isImage(file)) {
    return 'file-image';
  } else {
    return 'file';
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////

export function formatFileSize(bytes: number) {
  const precision: number = 2,
    sizes = ['B', 'KB', 'MB', 'GB', 'TB'],
    i = parseInt('' + Math.floor(Math.log(bytes) / Math.log(1024)));
  return (bytes / Math.pow(1024, i)).toFixed(precision) + ' ' + sizes[i];
}
