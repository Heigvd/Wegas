import { rest } from './rest';
import { IFiles, IFile } from '../../types/IFile';

// GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/exportRawXML
// GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/exportXML
// GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/exportZIP
// POST	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/importXML
// GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/list{absoluteDirectoryPath : .*?}
// GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/meta{absolutePath : .*?}
// GET	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/read{absolutePath : .*?}
// PUT	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/update{absolutePath : .*?}
// DELETE	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/{force: (force/)?}delete{absolutePath : .*?}
// POST	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/{force: (force/)?}upload{directory : .*?}
// DELETE	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/destruct

const FILE_BASE = (gameModelId: number) => `GameModel/${gameModelId}/File/`;

export type PageIndex = {
  id: string;
  index: number;
  name: string;
}[];

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
   * List all pages in a directory
   * @param gameModelId gameModelId to fetch IFiles from
   * @param absoluteDirectoryPath optional directory from where to list IFiles, will return the content of root directory if not set
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
   * List all pages in a directory
   * @param gameModelId gameModelId to fetch IFiles from
   * @param absolutePath file to delete
   * @param froce allows recursive delete on directories
   */
  // DELETE	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/{force: (force/)?}delete{absolutePath : .*?}
  async deleteFile(
    gameModelId: number,
    absolutePath: string,
    force?: boolean,
  ): Promise<IFile> {
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
            `Are you sure you want to delete ${absolutePath} with all IFiles and subdirectories?`,
          )
        ) {
          this.deleteFile(gameModelId, absolutePath, true);
        }
      });
  },
  /**
   * List all pages in a directory
   * @param gameModelId gameModelId to fetch IFiles from
   * @param name the name of the file to upload
   * @param path the path where to save the file (if undefined, takes root (/))
   * @param file the file to save (keep undefined for directory)
   */
  async createFile(
    gameModelId: number,
    name: string,
    path?: string,
    file?: File,
    force: boolean = false,
  ) {
    const data = new FormData();
    data.append('name', name);
    data.append('file', file as Blob);

    return await rest(
      FILE_BASE(gameModelId) + (force ? 'force/' : '') + 'upload' + path,
      {
        method: 'POST',
        body: data,
      },
    );
  },
};
