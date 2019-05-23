import { rest } from './rest';
import { generateGoodPath } from '../data/methods/ContentDescriptor';

type IFiles = IFile[];

const FILE_BASE = (gameModelId: number) => `GameModel/${gameModelId}/File/`;

export const FileAPI = {
  /**
   * Get all IFiles as raw XML
   * @param gameModelId gameModels'id
   */
  async getFilesAsRawXML(gameModelId: number): Promise<string> {
    return rest(FILE_BASE(gameModelId) + 'exportRawXML').then(
      async (res: Response) => {
        return await res.json();
      },
    );
  },
  /**
   * Get all IFiles as XML
   * @param gameModelId gameModels'id
   */
  async getFilesAsXML(gameModelId: number): Promise<string> {
    return rest(FILE_BASE(gameModelId) + 'exportXML').then(
      async (res: Response) => {
        return await res.json();
      },
    );
  },
  /**
   * Get all IFiles as ZIP
   * @param gameModelId gameModels'id
   */
  async getFilesAsZIP(gameModelId: number): Promise<string> {
    return rest(FILE_BASE(gameModelId) + 'exportZIP').then(
      async (res: Response) => {
        return await res.json();
      },
    );
  },

  /**
   * Import an XML file tree
   * @param gameModelId gameModels'id
   * @param xmlFiles xml to import
   */
  async importXML(gameModelId: number, xmlFiles: string) {
    const data = new FormData();
    data.append('file', xmlFiles);

    return await rest(FILE_BASE(gameModelId) + 'importXML', {
      method: 'POST',
      body: data,
    });
  },
  /**
   * List all files in a directory
   * @param gameModelId gameModelId to fetch files from
   * @param absoluteDirectoryPath optional directory from where to list files, will return the content of root directory if not set
   */
  async getFileList(
    gameModelId: number,
    absoluteDirectoryPath: string = '',
  ): Promise<IFiles> {
    return rest(FILE_BASE(gameModelId) + 'list' + absoluteDirectoryPath).then(
      async (res: Response) => {
        return await res.json();
      },
    );
  },
  /**
   * Delete a specific file
   * @param gameModelId gameModelId to fetch files from
   * @param absolutePath file to delete
   * @param froce allows recursive delete on directories
   */
  async deleteFile(
    gameModelId: number,
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
          return this.deleteFile(gameModelId, absolutePath, true);
        }
        throw Error('Force delete not accepted or failed');
      });
  },
  /**
   * Create a new file
   * @param gameModelId gameModelId to fetch files from
   * @param name the name of the file to upload
   * @param path the path where to save the file (if undefined, takes root (/))
   * @param file the file to save (keep undefined for directory)
   * @param force force modifying the file content
   */
  async createFile(
    gameModelId: number,
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
   * @param gameModelId gameModelId to fetch files from
   * @param absolutePath the absolute path of the file (if undefined, takes root (/))
   */
  async getFileMeta(
    gameModelId: number,
    absolutePath?: string,
  ): Promise<IFile> {
    return rest(FILE_BASE(gameModelId) + 'meta' + absolutePath).then(
      async (res: Response) => {
        return await res.json();
      },
    );
  },
  /**
   * Update file metadata
   * @param gameModelId gameModelId to fetch files from
   * @param file the file to update
   */
  async updateMetadata(gameModelId: number, file: IFile) {
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
   * @param gameModelId gameModelId to fetch files from
   */
  async destruct(gameModelId: number): Promise<IFile> {
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
   * @param gameModelId gameModelId to fetch files from
   * @param absolutePath the absolute path of the file to read
   */
  fileURL(gameModelId: number, absolutePath: string): string {
    return (
      API_ENDPOINT + 'GameModel/' + gameModelId + '/File/read' + absolutePath
    );
  },
};
