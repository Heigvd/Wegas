import { rest } from './rest';

interface Pages {
  [pageId: string]: Page;
}

const PAGE_BASE = (gameModelId: number) => `GameModel/${gameModelId}/Page/`;
async function extractPage(res: Response): Promise<Pages> {
  const j = await res.json();
  const pageHeader = res.headers.get('page')!;
  if (pageHeader !== '*') {
    return { [pageHeader]: j };
  }
  return j;
}

type PageIndex = Array<{
  id: string;
  index: number;
  name: string;
}>;

export const PageAPI = {
  /**
   * get default page
   * @param gameModelId gameModels'id
   */
  getDefault(gameModelId: number): Promise<Pages> {
    return rest(PAGE_BASE(gameModelId) + 'default').then(extractPage);
  },
  /**
   * fetch a page or all
   * @param gameModelId gameModelId to fetch pages from
   * @param pageId optional pageId, will return all page if omited
   */
  get(gameModelId: number, pageId: string = ''): Promise<Pages> {
    return rest(PAGE_BASE(gameModelId) + pageId).then(extractPage);
  },

  /**
   * Get page index
   * @param gameModelId
   */
  getIndex(gameModelId: number): Promise<PageIndex> {
    return rest(PAGE_BASE(gameModelId) + 'index').then(res => res.json());
  },
  /**
   * set a given page or create a new one.
   * @param gameModelId
   * @param page
   * @param id optional id. Create a new page if omitted
   */
  setPage(gameModelId: number, page: Page, id: string = '') {
    return rest(PAGE_BASE(gameModelId) + id, {
      method: 'PUT',
      body: JSON.stringify(page),
    }).then(extractPage);
  },
  /**
   * Delete a page or all page
   * @param gameModelId
   * @param id optional id to delete. delete all page if omitted
   */
  deletePage(gameModelId: number, id: string = ''): Promise<PageIndex> {
    return rest(PAGE_BASE(gameModelId) + id, {
      method: 'DELETE',
    }).then(res => res.json());
  },
  /**
   * Patch given page.
   * @param gameModelId
   * @param patch
   * @param id page to patch
   */
  patch(gameModelId: number, patch: string, id: string) {
    return rest(
      PAGE_BASE(gameModelId) + id,
      {
        method: 'PUT',
        body: patch,
      },
      undefined,
      'text/plain',
    ).then(extractPage);
  },
};
