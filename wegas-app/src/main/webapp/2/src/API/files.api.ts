import { rest } from './rest';

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



export interface ApiFile{
  bytes: number
  description: string
  directory: boolean
  mimeType: string
  name: string
  note: string
  path: string
  refId: string
  visibility: string
}

export type Files = ApiFile[];

const FILE_BASE = (gameModelId: number) => `GameModel/${gameModelId}/File/`;
// async function extractPage(res: Response): Promise<Pages> {
//   const j = await res.json();
//   const pageHeader = res.headers.get('page')!;
//   if (pageHeader !== '*') {
//     return { [pageHeader]: j };
//   }
//   return j;
// }

export type PageIndex = Array<{
  id: string;
  index: number;
  name: string;
}>;

export const FileAPI = {
  /**
   * Get all files as raw XML
   * @param gameModelId gameModels'id
   */
  async getFilesAsRawXML(gameModelId: number): Promise<String> {
    return rest(FILE_BASE(gameModelId) + 'exportRawXML')
    .then(async (res: Response) => {
      return await res.json();
    });
  },
  /**
   * List all pages in a directory
   * @param gameModelId gameModelId to fetch files from
   * @param absoluteDirectoryPath optional directory from where to list files, will return the content of root directory if not set
   */
  async getFileList(gameModelId: number, absoluteDirectoryPath: string = ''): Promise<Files> {
    return rest(FILE_BASE(gameModelId) + 'list' + absoluteDirectoryPath)
    .then(async (res: Response) =>{
      return await res.json();
    });
  },

  // POST	/Wegas/rest/GameModel/{gameModelId : ([1-9][0-9]*)?}/File/{force: (force/)?}upload{directory : .*?}
  async createFile(gameModelId: number, name: string, path?: string, file: string = 'null') {

    const data = new FormData();
    data.append('name', name);
    data.append('file', file);

    return rest(FILE_BASE(gameModelId) + 'upload' + path, {
      method: 'POST',
      body: data,
    });
  },
  // /**
  //  * Get page index
  //  * @param gameModelId
  //  */
  // getIndex(gameModelId: number): Promise<PageIndex> {
  //   return rest(PAGE_BASE(gameModelId) + 'index').then(res => res.json());
  // },
  // /**
  //  * set a given page or create a new one.
  //  * @param gameModelId
  //  * @param page
  //  * @param id optional id. Create a new page if omitted
  //  */
  // setPage(gameModelId: number, page: WegasComponent, id: string = '') {
  //   return rest(PAGE_BASE(gameModelId) + id, {
  //     method: 'PUT',
  //     body: JSON.stringify(page),
  //   }).then(extractPage);
  // },
  // /**
  //  * Delete a page or all page
  //  * @param gameModelId
  //  * @param id optional id to delete. delete all page if omitted
  //  */
  // deletePage(gameModelId: number, id: string = ''): Promise<PageIndex> {
  //   return rest(PAGE_BASE(gameModelId) + id, {
  //     method: 'DELETE',
  //   }).then(res => res.json());
  // },
  // /**
  //  * Patch given page.
  //  * @param gameModelId
  //  * @param patch
  //  * @param id page to patch
  //  */
  // patch(gameModelId: number, patch: string, id: string) {
  //   return rest(
  //     PAGE_BASE(gameModelId) + id,
  //     {
  //       method: 'PUT',
  //       body: patch,
  //     },
  //     undefined,
  //     'text/plain',
  //   ).then(extractPage);
  // },
  // /**
  //  * Move a page to a given index
  //  * @param gameModelId 
  //  * @param index position to put the page to
  //  * @param id page to move
  //  */
  // move(gameModelId: number, index: number, id: string): Promise<PageIndex> {
  //   return rest(PAGE_BASE(gameModelId) + id + '/move/' + index, {
  //     method: 'PUT',
  //   }).then(res => res.json());
  // },
};
