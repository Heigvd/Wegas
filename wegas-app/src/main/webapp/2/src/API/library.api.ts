import { rest } from './rest';
import { GameModel } from '../data/selectors';

export type LibType = 'CSS' | 'ClientScript' | 'ServerScript';
export type NewLibErrors = 'NOTNEW' | 'UNKNOWN';
<<<<<<< HEAD
=======
export interface ILibraries {
  [key: string]: IGameModelContent;
}
>>>>>>> origin/master

const LIBRARY_BASE = (libType: LibType, gameModelId?: number) =>
  `GameModel/${
    gameModelId ? gameModelId : GameModel.selectCurrent().id!
  }/Library/${libType}`;

export const LibraryAPIFactory = (gameModelId?: number) => {
  return {
    getAllLibraries(libType: LibType): Promise<ILibraries> {
      return rest(LIBRARY_BASE(libType, gameModelId)).then((res: Response) => {
        return res.json();
      });
    },
<<<<<<< HEAD
    getLibrary(libType: LibType, name: string): Promise<ILibrary> {
=======
    getLibrary(libType: LibType, name: string): Promise<IGameModelContent> {
>>>>>>> origin/master
      return rest(LIBRARY_BASE(libType, gameModelId) + '/' + name).then(
        async (res: Response) => {
          return res.json();
        },
      );
    },
    addLibrary(
      libType: LibType,
      name: string,
<<<<<<< HEAD
      library?: ILibrary,
    ): Promise<ILibrary> {
      return rest(LIBRARY_BASE(libType, gameModelId) + '/' + name, {
        method: 'POST',
        body: JSON.stringify({
          '@class': 'GameModelContent',
          ...library,
        }),
=======
      content: string,
      visibility?: IAbstractContentDescriptor['visibility'],
    ): Promise<IGameModelContent> {
      const newLib: IGameModelContent = {
        '@class': 'GameModelContent',
        content: content,
        contentType: libType,
        version: 0,
        visibility: visibility,
      };
      return rest(LIBRARY_BASE(libType, gameModelId) + '/' + name, {
        method: 'POST',
        body: JSON.stringify(newLib),
>>>>>>> origin/master
      })
        .then((res: Response) => {
          return res.json();
        })
        .catch((e: Error) => {
          if (e.message === 'Bad Request') {
            throw Error('NOTNEW');
          } else {
            throw Error('UNKNOWN');
          }
        });
    },
<<<<<<< HEAD
    saveLibrary(libType: LibType, name: string, library: ILibrary) {
=======
    saveLibrary(libType: LibType, name: string, library: IGameModelContent) {
>>>>>>> origin/master
      return rest(
        LIBRARY_BASE(libType, gameModelId) + '/' + name,
        {
          method: 'PUT',
<<<<<<< HEAD
          body: JSON.stringify({
            '@class': 'GameModelContent',
            ...library,
          }),
=======
          body: JSON.stringify(library),
>>>>>>> origin/master
        },
        'Editor',
        'application/json',
      );
    },
    deleteLibrary(libType: LibType, name: string) {
      return rest(LIBRARY_BASE(libType, gameModelId) + '/' + name, {
        method: 'DELETE',
      });
    },
  };
};

export const LibraryAPI = LibraryAPIFactory();
