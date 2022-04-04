import { IAbstractContentDescriptor, IGameModelContent } from 'wegas-ts-api';
import { GameModel } from '../data/selectors';
import { rest } from './rest';

export const NOCONTENTMESSAGE = 'No content';

export type ServerLibraryType =
  | 'CSS'
  | 'ClientScript'
  | 'ServerScript'
  | 'Theme'
  | 'SelectedThemes';
export type NewLibErrors = 'NOTNEW' | 'UNKNOWN';
export interface ILibraries {
  [key: string]: IGameModelContent;
}

const LIBRARY_BASE = (libType: ServerLibraryType, gameModelId?: number) =>
  `GameModel/${
    gameModelId ? gameModelId : GameModel.selectCurrent().id!
  }/Library/${libType}`;

export const LibraryAPIFactory = (gameModelId?: number) => {
  return {
    getAllLibraries(libType: ServerLibraryType): Promise<ILibraries> {
      return rest(LIBRARY_BASE(libType, gameModelId)).then((res: Response) => {
        return res.json();
      });
    },
    getLibrary(
      libType: ServerLibraryType,
      name: string,
    ): Promise<IGameModelContent> {
      return rest(LIBRARY_BASE(libType, gameModelId) + '/' + name).then(
        (res: Response) => {
          if (res.status === 204) {
            throw Error(NOCONTENTMESSAGE);
          }
          return res.json();
        },
      );
    },
    addLibrary(
      libType: ServerLibraryType,
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
    saveLibrary(
      libType: ServerLibraryType,
      name: string,
      library: IGameModelContent,
    ): Promise<IGameModelContent> {
      return rest(
        LIBRARY_BASE(libType, gameModelId) + '/' + name,
        {
          method: 'PUT',
          body: JSON.stringify(library),
        },
        'Editor',
        'application/json',
      ).then((res: Response) => {
        return res.json();
      });
    },
    deleteLibrary(libType: ServerLibraryType, name: string) {
      return rest(LIBRARY_BASE(libType, gameModelId) + '/' + name, {
        method: 'DELETE',
      });
    },
  };
};

export const LibraryAPI = LibraryAPIFactory();
