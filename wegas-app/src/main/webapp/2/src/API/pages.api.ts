import { rest } from './rest';

const PAGE_BASE = (gameModelId: number) => `GameModel/${gameModelId}/Page/`;

async function extractPage(res: Response): Promise<Pages> {
  const j = await res.json();
  const pageHeader = res.headers.get('page')!;
  if (pageHeader !== '*') {
    return { [pageHeader]: j };
  }
  return j;
}

export const PageAPI = {
  /**
   * get default page
   * @param gameModelId gameModels'id
   */
  getDefault(gameModelId: number): Promise<Pages> {
    return rest(PAGE_BASE(gameModelId) + 'Page/default').then(extractPage);
  },
  /**
   * fetch a page
   * @param gameModelId gameModelId to fetch pages from
   * @param pageId optional pageId
   */
  get(gameModelId: number, pageId: string): Promise<Pages> {
    return rest(PAGE_BASE(gameModelId) + 'Page/' + pageId).then(res => {
      return extractPage(res);
    });
  },
  /**
   * fetch a page
   * @param gameModelId gameModelId to fetch pages from
   * @param pageId optional pageId
   */
  getAll(gameModelId: number): Promise<AllPages> {
    return rest(PAGE_BASE(gameModelId)).then(res => {
      return res.json();
    });
  },
  /**
   * Get page index
   * @param gameModelId
   */
  getIndex(gameModelId: number): Promise<PageIndex> {
    return rest(PAGE_BASE(gameModelId) + 'Index').then(res => res.json());
  },
  /**
   * update an item of the index
   * @param gameModelId
   * @param path of the item to update ([folder.name | page.id])
   * @param item new version of the item
   * @returns the new PageIndex
   */
  updateIndexItem(
    gameModelId: number,
    itemPath: string[],
    item: PageIndexItem,
  ): Promise<PageIndex> {
    return rest(PAGE_BASE(gameModelId) + 'UpdateIndex', {
      method: 'PUT',
      body: JSON.stringify({
        path: itemPath,
        item: item,
      }),
    }).then(res => res.json());
  },

  /**
   * update move an item
   * @param gameModelId
   * @param itemPath path of the item to move ([folder.name | page.id])
   * @param folderPath path of destination folder([folder.name | page.id])
   * @param pos position in the destination folder, none means last position
   * @returns the new PageIndex
   */
  moveIndexItem(
    gameModelId: number,
    itemPath: string[],
    folderPath: string[],
    pos?: number,
  ): Promise<PageIndex> {
    return rest(PAGE_BASE(gameModelId) + 'Move', {
      method: 'PUT',
      body: JSON.stringify({
        from: itemPath,
        to: folderPath,
        pos: pos,
      }),
    }).then(res => res.json());
  },

  /**
   * update move an item
   * @param gameModelId
   * @param pageId id of the new default page
   * @returns the new PageIndex
   */
  setDefaultPage(gameModelId: number, pageId: string): Promise<PageIndex> {
    return rest(PAGE_BASE(gameModelId) + 'SetDefault/' + pageId, {
      method: 'PUT',
    }).then(res => res.json());
  },

  /**
   * Create a new item in the index
   * @param gameModelId
   * @param folderPath path of ther folder in which to create the item ([folder.name | page.id])
   * @param item the new item to add
   * @param pageContent the defaut page content if the item is a page
   * @returns the new PageIndex
   */
  newIndexItem(
    gameModelId: number,
    folderPath: string[],
    newItem: PageIndexItem,
    pageContent?: WegasComponent,
  ) {
    return rest(PAGE_BASE(gameModelId) + 'CreateIndexItem', {
      method: 'PUT',
      body: JSON.stringify({
        path: folderPath,
        item: newItem,
        payload: pageContent,
      }),
    }).then(res => res.json());
  },

  /**
   * set a given page or create a new one.
   * @param gameModelId
   * @param page
   * @param id optional id. Create a new page if omitted
   */
  setPage(
    gameModelId: number,
    page: WegasComponent,
    id: string,
    extract: boolean = false,
  ) {
    return rest(PAGE_BASE(gameModelId) + 'Page/' + id, {
      method: 'PUT',
      body: JSON.stringify(page),
    }).then(res => {
      if (extract) {
        return extractPage(res);
      } else {
        return res.json();
      }
    });
  },
  /**
   * Delete a page or all page
   * @param gameModelId
   * @param id optional id to delete. delete all page if omitted
   */
  deletePage(gameModelId: number, id: string = ''): Promise<PageIndex> {
    return rest(PAGE_BASE(gameModelId) + 'Page/' + id, {
      method: 'DELETE',
    }).then(res => res.json());
  },
  /**
   * Patch given page.
   * @param gameModelId
   * @param patch
   * @param id page to patch
   */
  patch(
    gameModelId: number,
    patch: string,
    id: string,
    extract: boolean = false,
  ) {
    return rest(
      PAGE_BASE(gameModelId) + 'Patch/' + id,
      {
        method: 'PUT',
        body: patch,
      },
      undefined,
      'text/plain',
    ).then(res => {
      if (extract) {
        return extractPage(res);
      } else {
        return res.json();
      }
    });
  },
};
