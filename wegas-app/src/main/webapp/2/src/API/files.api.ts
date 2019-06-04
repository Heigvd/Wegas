import { rest } from './rest';
import { generateGoodPath } from '../data/methods/ContentDescriptor';
import { GameModel } from '../data/selectors';

const FILE_BASE = (gameModelId?: number) =>
  `GameModel/${
    gameModelId === undefined ? GameModel.selectCurrent().id! : gameModelId
  }/File/`;

export const FileAPIFactory = (gameModelId?: number) => {
  return {
    /**
     * Get all IFiles as raw XML
     */
    async getFilesAsRawXML(): Promise<string> {
      return rest(FILE_BASE(gameModelId) + 'exportRawXML').then(
        async (res: Response) => {
          return await res.json();
        },
      );
    },
    /**
     * Get all IFiles as XML
     */
    async getFilesAsXML(): Promise<string> {
      return rest(FILE_BASE(gameModelId) + 'exportXML').then(
        async (res: Response) => {
          return await res.json();
        },
      );
    },
    /**
     * Get all IFiles as ZIP
     */
    async getFilesAsZIP(): Promise<string> {
      return rest(FILE_BASE(gameModelId) + 'exportZIP').then(
        async (res: Response) => {
          return await res.json();
        },
      );
    },

    /**
     * Import an XML file tree
     * @param xmlFiles xml to import
     */
    async importXML(xmlFiles: string) {
      const data = new FormData();
      data.append('file', xmlFiles);

      return await rest(FILE_BASE(gameModelId) + 'importXML', {
        method: 'POST',
        body: data,
      });
    },
    /**
     * List all files in a directory
     * @param absoluteDirectoryPath optional directory from where to list files, will return the content of root directory if not set
     * @param recursive list recursively directory content and subdirectories content
     */
    async getFileList(
      absoluteDirectoryPath: string = '',
      recursive?: boolean,
    ): Promise<IFile[]> {
      return rest(
        FILE_BASE(gameModelId) +
          (recursive ? 'recurseList' : 'list') +
          absoluteDirectoryPath,
      ).then(async (res: Response) => {
        return await res.json();
      });
    },
    /**
     * Delete a specific file
     * @param absolutePath file to delete
     * @param froce allows recursive delete on directories
     */
    async deleteFile(
      absolutePath: string,
      force?: boolean,
    ): Promise<IFile | undefined> {
      return rest(
        FILE_BASE(gameModelId) +
          (force ? 'force/' : '') +
          'delete' +
          absolutePath,
        {
          method: 'DELETE',
        },
      )
        .then(async (res: Response) => {
          return await res.json();
        })
        .catch(() => {
          if (
            confirm(
              `Are you sure you want to delete ${absolutePath} with all files and subdirectories?`,
            )
          ) {
            return this.deleteFile(absolutePath, true);
          }
          throw Error('Force delete not accepted or failed');
        });
    },
    /**
     * Create a new file
     * @param name the name of the file to upload
     * @param path the path where to save the file (if undefined, takes root (/))
     * @param file the file to save (keep undefined for directory)
     * @param force force modifying the file content
     */
    async createFile(
      name: string,
      path: string = '',
      file?: File,
      force: boolean = false,
    ): Promise<IFile> {
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
      ).then(async (res: Response) => {
        return await res.json();
      });
    },
    /**
     * Get metata of a specific file/directory
     * @param absolutePath the absolute path of the file (if undefined, takes root (/))
     */
    async getFileMeta(absolutePath: string = ''): Promise<IFile> {
      return rest(FILE_BASE(gameModelId) + 'meta' + absolutePath).then(
        async (res: Response) => {
          return await res.json();
        },
      );
    },
    /**
     * Update file metadata
     * @param file the file to update
     */
    async updateMetadata(file: IFile) {
      return await rest(
        FILE_BASE(gameModelId) + 'update' + generateGoodPath(file),
        {
          method: 'PUT',
          body: JSON.stringify(file),
        },
      ).then(async (res: Response) => {
        return await res.json();
      });
    },
    /**
     * Delete the whole file tree
     */
    async destruct(): Promise<IFile> {
      return rest(
        FILE_BASE(gameModelId) +
          'destruct' +
          {
            method: 'DELETE',
          },
      ).then(async (res: Response) => {
        return await res.json();
      });
    },

    /**
     * Returns url to read a file
     * @param absolutePath the absolute path of the file to read
     */
    fileURL(absolutePath: string): string {
      return API_ENDPOINT + FILE_BASE(gameModelId) + 'read' + absolutePath;
    },
  };
};

export const FileAPI = FileAPIFactory();
