import { rest } from './rest';
import { GameModel } from '../data/selectors';
import { IGameModelContent, IAbstractContentDescriptor } from 'wegas-ts-api';

export type LibType = 'CSS' | 'ClientScript' | 'ServerScript';
export type NewLibErrors = 'NOTNEW' | 'UNKNOWN';
export interface ILibraries {
  [key: string]: IGameModelContent;
}

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
    getLibrary(libType: LibType, name: string): Promise<IGameModelContent> {
      return rest(LIBRARY_BASE(libType, gameModelId) + '/' + name).then(
        async (res: Response) => {
          return res.json();
        },
      );
    },
    addLibrary(
      libType: LibType,
      mimeType: string,
      name: string,
      content: string,
      visibility?: IAbstractContentDescriptor['visibility'],
    ): Promise<IGameModelContent> {
      const newLib: IGameModelContent = {
        '@class': 'GameModelContent',
        content: content,
        contentType: mimeType,
        version: 0,
        visibility: visibility,
      };
      return rest(LIBRARY_BASE(libType, gameModelId) + '/' + name, {
        method: 'POST',
        body: JSON.stringify(newLib),
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
    saveLibrary(libType: LibType, name: string, library: IGameModelContent) {
      return rest(
        LIBRARY_BASE(libType, gameModelId) + '/' + name,
        {
          method: 'PUT',
          body: JSON.stringify(library),
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
