import { rest } from './rest';
import { GameModel } from '../data/selectors';
import { PageState } from '../data/Reducer/pageState';

const PAGE_BASE = (gameModelId?: number) =>
  `GameModel/${
    gameModelId === undefined
      ? GameModel != null
        ? GameModel.selectCurrent().id!
        : CurrentGM.id!
      : gameModelId
  }/Page/`;

async function extractPage(res: Response): Promise<Pages> {
  const j = await res.json();
  const pageHeader = res.headers.get('page')!;
  if (pageHeader !== '*') {
    return { [pageHeader]: j };
  }
  return j;
}

/**
 * PageAPIFactory - generates en object containing methods to manage pages
 * @param gameModelId
 */
export const PageAPIFactory = (gameModelId?: number) => {
  return {
    /**
     * get default page
     */
    getDefault(): Promise<Pages> {
      return rest(PAGE_BASE(gameModelId) + 'Page/default').then(extractPage);
    },
    /**
     * fetch a page
     * @param pageId optional pageId
     */
    get(pageId: string): Promise<Pages> {
      return rest(PAGE_BASE(gameModelId) + 'Page/' + pageId).then(res => {
        return extractPage(res);
      });
    },
    /**
     * fetch a page
     * @param pageId optional pageId
     */
    getAll(): Promise<AllPages> {
      return rest(PAGE_BASE(gameModelId)).then(res => {
        return res.json();
      });
    },
    /**
     * Get page index
     */
    getIndex(): Promise<PageIndex> {
      return rest(PAGE_BASE(gameModelId) + 'Index')
        .then(res => res.json())
        .catch();
    },
    /**
     * update an item of the index
     * @param path of the item to update ([folder.name | page.id])
     * @param item new version of the item
     * @returns the new PageIndex
     */
    updateIndexItem(
      itemPath: string[],
      item: PageIndexItem,
    ): Promise<PageIndex> {
      return rest(PAGE_BASE(gameModelId) + 'IndexItem', {
        method: 'PUT',
        body: JSON.stringify({
          path: itemPath,
          item: item,
        }),
      }).then(res => res.json());
    },

    /**
     * update move an item
     * @param itemPath path of the item to move ([folder.name | page.id])
     * @param folderPath path of destination folder([folder.name | page.id])
     * @param pos position in the destination folder, none means last position
     * @returns the new PageIndex
     */
    moveIndexItem(
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
     * @param pageId id of the new default page
     * @returns the new PageIndex
     */
    setDefaultPage(pageId: string): Promise<PageIndex> {
      return rest(PAGE_BASE(gameModelId) + 'SetDefault/' + pageId, {
        method: 'PUT',
      }).then(res => res.json());
    },

    /**
     * Create a new item in the index
     * @param folderPath path of ther folder in which to create the item ([folder.name | page.id])
     * @param item the new item to add
     * @param pageContent the defaut page content if the item is a page
     * @returns the new PageIndex
     */
    newIndexItem(
      folderPath: string[],
      newItem: PageIndexItem,
      pageContent?: WegasComponent,
    ) {
      return rest(PAGE_BASE(gameModelId) + 'IndexItem', {
        method: 'POST',
        body: JSON.stringify({
          path: folderPath,
          item: newItem,
          payload: pageContent,
        }),
      }).then(res => res.json());
    },

    /**
     * delete an item of the index. One can not delete a not-empty folder
     * @param path of the item to delete ([folder.name | page.id])
     * @returns the new PageIndex
     */
    deleteIndexItem(itemPath: string[]): Promise<PageIndex> {
      return rest(PAGE_BASE(gameModelId) + 'DeleteIndexItem', {
        method: 'POST', // do not use DELETE, otherwise won't be able to post a body!
        body: JSON.stringify({
          path: itemPath,
        }),
      }).then(res => res.json());
    },

    /**
     * set a given page or create a new one.
     * @param page
     * @param id optional id. Create a new page if omitted
     */
    setPage(page: WegasComponent, id: string, extract: boolean = false) {
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
     * @param id optional id to delete. delete all page if omitted
     */
    deletePage(id: string): Promise<PageIndex> {
      return rest(PAGE_BASE(gameModelId) + 'Page/' + id, {
        method: 'DELETE',
      }).then(res => res.json());
    },
    /**
     * Patch given page.
     * @param patch
     * @param id page to patch
     */
    patch(patch: string, id: string, extract: boolean = false) {
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
};

export const PageAPI = PageAPIFactory();
