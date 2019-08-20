import { rest } from './rest';
import { GameModel } from '../data/selectors';

/*
PUT     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/BatchUpdate
PUT     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/CopyLanguage/{source: [a-zA-Z]+}/{target: [a-zA-Z]+}
POST    /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/deepl/translate
POST    /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/deepl/usage
GET     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/EditableLanguages
PUT     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/InitLanguage/{source: [a-zA-Z]+}/{target: [a-zA-Z]+}
POST    /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/Lang
DELETE  /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/Lang/{lang : [^\/]*}
PUT     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/Langs
GET     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/Print
GET     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/Tr/{code : [^\/]*}/{trId: [1-9][0-9]*}
PUT     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/Tr/{mode : [A-Z_]+}
PUT     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/Translate/{source: [a-zA-Z]+}/{target: [a-zA-Z]+}
GET     /Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}I18n/Usage
*/

const LANGUAGES_BASE = (gameModelId?: number) =>
  `GameModel/${
    gameModelId === undefined ? GameModel.selectCurrent().id! : gameModelId
  }/I18n/`;

const LanguagesAPIFactory = (gameModelId?: number) => {
  return {
    /**
     * List all languages of a game model
     */
    getDeeplAvailableLanguageList(): Promise<IGameModelLanguage[]> {
      return rest(LANGUAGES_BASE(gameModelId) + 'AvailableLanguages').then(
        (res: Response) => {
          return res.json();
        },
      );
    },
    /**
     * Get the list of editable languages
     * if anwser is ["*"] everything is editable and a new language can be created
     */
    getEditableLanguages(): Promise<(IGameModelLanguage | '*')[]> {
      return rest(LANGUAGES_BASE(gameModelId) + 'EditableLanguages').then(
        (res: Response) => {
          return res.json();
        },
      );
    },
    /**
     * Increase a language priority
     * @param language The language to priorize
     */
    upLanguage(language: IGameModelLanguage) {
      return rest(LANGUAGES_BASE(gameModelId) + 'Lang/' + language.id + '/Up', {
        method: 'PUT',
      }).then((res: Response) => {
        return res.json() as Promise<IGameModel>;
      });
    },
    /**
     * Update language value
     * @param language The language to update
     */
    updateLanguage(language: IGameModelLanguage) {
      return rest(LANGUAGES_BASE(gameModelId) + 'Lang', {
        method: 'PUT',
        body: JSON.stringify(language),
      }).then((res: Response) => {
        return res.json() as Promise<IGameModelLanguage>;
      });
    },

    //   /**
    //    * Delete a specific file
    //    * @param absolutePath file to delete
    //    * @param froce allows recursive delete on directories
    //    */
    //   deleteFile(
    //     absolutePath: string,
    //     force?: boolean,
    //   ): Promise<IFileDescriptor | undefined> {
    //     return rest(
    //       TRANSLATION_BASE(gameModelId) +
    //         (force ? 'force/' : '') +
    //         'delete' +
    //         absolutePath,
    //       {
    //         method: 'DELETE',
    //       },
    //     )
    //       .then((res: Response) => {
    //         return res.json();
    //       })
    //       .catch(() => {
    //         if (
    //           confirm(
    //             `Are you sure you want to delete ${absolutePath} with all files and subdirectories?`,
    //           )
    //         ) {
    //           return this.deleteFile(absolutePath, true);
    //         }
    //         throw Error('Force delete not accepted or failed');
    //       });
    //   },
    //   /**
    //    * Create a new file
    //    * @param name the name of the file to upload
    //    * @param path the path where to save the file (if undefined, takes root (/))
    //    * @param file the file to save (keep undefined for directory)
    //    * @param force force modifying the file content
    //    */
    //   createFile(
    //     name: string,
    //     path: string = '',
    //     file?: File,
    //     force: boolean = false,
    //   ): Promise<IFileDescriptor> {
    //     const data = new FormData();
    //     data.append('name', name);
    //     data.append('file', file as Blob);
    //     return rest(
    //       TRANSLATION_BASE(gameModelId) +
    //         (force ? 'force/' : '') +
    //         'upload' +
    //         path,
    //       {
    //         method: 'POST',
    //         body: data,
    //       },
    //       undefined,
    //       'multipart/form-data',
    //     ).then((res: Response) => {
    //       return res.json();
    //     });
    //   },
    //   /**
    //    * Get metata of a specific file/directory
    //    * @param absolutePath the absolute path of the file (if undefined, takes root (/))
    //    */
    //   getFileMeta(absolutePath: string = ''): Promise<IFileDescriptor> {
    //     return rest(TRANSLATION_BASE(gameModelId) + 'meta' + absolutePath).then(
    //       (res: Response) => {
    //         return res.json();
    //       },
    //     );
    //   },
    //   /**
    //    * Update file metadata
    //    * @param file the file to update
    //    */
    //   updateMetadata(file: IFileDescriptor) {
    //     return rest(
    //       TRANSLATION_BASE(gameModelId) + 'update' + generateAbsolutePath(file),
    //       {
    //         method: 'PUT',
    //         body: JSON.stringify(file),
    //       },
    //     ).then((res: Response) => {
    //       if (res.status === 204) {
    //         throw Error(res.statusText);
    //       }
    //       return res.json();
    //     });
    //   },
    //   /**
    //    * Delete the whole file tree
    //    */
    //   destruct(): Promise<IFileDescriptor> {
    //     return rest(
    //       TRANSLATION_BASE(gameModelId) +
    //         'destruct' +
    //         {
    //           method: 'DELETE',
    //         },
    //     ).then((res: Response) => {
    //       return res.json();
    //     });
    //   },
  };
};

export const LanguagesAPI = LanguagesAPIFactory();
