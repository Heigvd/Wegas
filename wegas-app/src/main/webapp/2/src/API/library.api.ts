import { rest } from './rest';

export type LibType = 'CSS' | 'ClientScript' | 'Script';
export type NewLibErrors = 'NOTNEW' | 'UNKNOWN';

const LIBRARY_BASE = (gameModelId: number, libType: LibType) =>
  `GameModel/${gameModelId}/Library/${libType}`;

export const LibraryApi = {
  /**
   * get all libraries
   * @param gameModelId gameModels'id
   * @param libType library types (CSS, ClientScript, ServerScript)
   */
  getAllLibraries(gameModelId: number, libType: LibType): Promise<ILibraries> {
    return rest(LIBRARY_BASE(gameModelId, libType)).then((res: Response) => {
      return res.json();
    });
  },
  addLibrary(
    gameModelId: number,
    libType: LibType,
    name: string,
    library?: ILibrary,
  ): Promise<IGameModel> {
    return rest(LIBRARY_BASE(gameModelId, libType) + '/' + name, {
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
  saveLibrary(
    gameModelId: number,
    libType: LibType,
    name: string,
    library: ILibrary,
  ) {
    return rest(
      LIBRARY_BASE(gameModelId, libType) + '/' + name,
      {
        method: 'PUT',
        body: JSON.stringify({
          ...{
            '@class': 'GameModelContent',
          },
          ...library,
        }),
      },
      'Editor',
      'application/json',
    );
  },
  deleteLibrary(gameModelId: number, libType: LibType, name: string) {
    return rest(LIBRARY_BASE(gameModelId, libType) + '/' + name, {
      method: 'DELETE',
    });
  },
};
