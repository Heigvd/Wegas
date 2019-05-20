import { rest } from './rest';
import { GameModel } from '../data/selectors';

export type LibType = 'CSS' | 'ClientScript' | 'ServerScript';
export type NewLibErrors = 'NOTNEW' | 'UNKNOWN';

const LIBRARY_BASE = (libType: LibType) =>
  `GameModel/${GameModel.selectCurrent().id!}/Library/${libType}`;

export const LibraryApi = {
  /**
   * get all libraries
   * @param gameModelId gameModels'id
   * @param libType library types (CSS, ClientScript, ServerScript)
   */
  getAllLibraries(libType: LibType): Promise<ILibraries> {
    return rest(LIBRARY_BASE(libType)).then((res: Response) => {
      return res.json();
    });
  },
  getLibrary(libType: LibType, name: string): Promise<ILibrary> {
    return rest(LIBRARY_BASE(libType) + '/' + name).then(
      async (res: Response) => {
        return res.json();
      },
    );
  },
  addLibrary(
    libType: LibType,
    name: string,
    library?: ILibrary,
  ): Promise<ILibrary> {
    return rest(LIBRARY_BASE(libType) + '/' + name, {
      method: 'POST',
      body: JSON.stringify({
        '@class': 'GameModelContent',
        ...library,
      }),
    })
      .then((res: Response) => {
        return res.json();
      })
      .catch((e: Error) => {
        if (e.message === 'Bad Request') {
          throw 'NOTNEW';
        } else {
          throw 'UNKNOWN';
        }
      });
  },
  saveLibrary(libType: LibType, name: string, library: ILibrary) {
    return rest(
      LIBRARY_BASE(libType) + '/' + name,
      {
        method: 'PUT',
        body: JSON.stringify({
          '@class': 'GameModelContent',
          ...library,
        }),
      },
      'Editor',
      'application/json',
    );
  },
  deleteLibrary(libType: LibType, name: string) {
    return rest(LIBRARY_BASE(libType) + '/' + name, {
      method: 'DELETE',
    });
  },
};
