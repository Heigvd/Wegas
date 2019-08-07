import { rest } from './rest';
import { GameModel } from '../data/selectors';

/**
 * Compute an absolute path for a path and a fileName.
 * @param param0 FileDescriptor like object to compute absolute path from
 */
export function generateAbsolutePath({
  path,
  name,
}: {
  path: string;
  name: string;
}) {
  return path.replace(/(\/)$/, '') + '/' + name;
}

export const FILE_BASE = (gameModelId?: number) =>
  `GameModel/${
    gameModelId === undefined ? GameModel.selectCurrent().id! : gameModelId
  }/File/`;

export const FileAPIFactory = (gameModelId?: number) => {
  return {
    /**
     * List all files in a directory
     * @param absoluteDirectoryPath optional directory from where to list files, will return the content of root directory if not set
     * @param recursive list recursively directory content and subdirectories content
     */
    getFileList(
      absoluteDirectoryPath: string = '',
      recursive?: boolean,
    ): Promise<IFileDescriptor[]> {
      return rest(
        FILE_BASE(gameModelId) +
          (recursive ? 'recurseList' : 'list') +
          absoluteDirectoryPath,
      ).then((res: Response) => {
        return res.json();
      });
    },
    /**
     * Delete a specific file
     * @param absolutePath file to delete
     * @param froce allows recursive delete on directories
     */
    deleteFile(
      absolutePath: string,
      force?: boolean,
    ): Promise<IFileDescriptor | undefined> {
      return rest(
        FILE_BASE(gameModelId) +
          (force ? 'force/' : '') +
          'delete' +
          absolutePath,
        {
          method: 'DELETE',
        },
      ).then((res: Response) => {
        return res.json();
      });
    },
    /**
     * Create a new file
     * @param name the name of the file to upload
     * @param path the path where to save the file (if undefined, takes root (/))
     * @param file the file to save (keep undefined for directory)
     * @param force force modifying the file content
     */
    createFile(
      name: string,
      path: string = '',
      file?: File,
      force: boolean = false,
    ): Promise<IFileDescriptor> {
      const data = new FormData();
      data.append('name', name);
      data.append('file', file as Blob);
      return rest(
        FILE_BASE(gameModelId) + (force ? 'force/' : '') + 'upload' + path,
        {
          method: 'POST',
          body: data,
        },
        undefined,
        'multipart/form-data',
      ).then((res: Response) => res.json());
    },
    /**
     * Get metata of a specific file/directory
     * @param absolutePath the absolute path of the file (if undefined, takes root (/))
     */
    getFileMeta(absolutePath: string = ''): Promise<IFileDescriptor> {
      return rest(FILE_BASE(gameModelId) + 'meta' + absolutePath).then(
        (res: Response) => {
          return res.json();
        },
      );
    },
    /**
     * Update file metadata
     * @param file the file to update
     */
    updateMetadata(file: IFileDescriptor) {
      return rest(
        FILE_BASE(gameModelId) + 'update' + generateAbsolutePath(file),
        {
          method: 'PUT',
          body: JSON.stringify(file),
        },
      ).then((res: Response) => {
        // 204 is seen as an error as the file wasn't updated
        if (res.status === 204) {
          throw Error(res.statusText);
        }
        return res.json();
      });
    },
    /**
     * Delete the whole file tree
     */
    destruct(): Promise<IFileDescriptor> {
      return rest(
        FILE_BASE(gameModelId) +
          'destruct' +
          {
            method: 'DELETE',
          },
      ).then((res: Response) => {
        return res.json();
      });
    },
  };
};

export const FileAPI = FileAPIFactory();
