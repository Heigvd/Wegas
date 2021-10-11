import { IGameModel, IGameModelLanguage } from 'wegas-ts-api';
import { GameModel } from '../data/selectors';
import { managedModeRequest, rest } from './rest';

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

export interface IInScriptUpdate {
  '@class': 'InScriptUpdate';
  code: string;
  fieldName: string;
  index: number;
  parentClass: string;
  parentId: number;
  value: string;
}

export interface ITranslationUpdate {
  '@class': 'TranslationUpdate';
  code: string;
  trId: number;
  value: string;
}

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
    /**
     * Add new language
     * @param language The language to update
     */
    addLanguage(language: IGameModelLanguage) {
      return managedModeRequest(LANGUAGES_BASE(gameModelId) + 'Lang', {
        method: 'POST',
        body: JSON.stringify(language),
      });
    },

    /**
     * Delete language value
     * @param code The code of the language to delete (FR/EN/DE/etc...)
     */
    deleteLanguage(code: string) {
      return rest(LANGUAGES_BASE(gameModelId) + 'Lang/' + code, {
        method: 'DELETE',
      }).then((res: Response) => {
        return res.json() as Promise<IGameModel>;
      });
    },

    /**
     * Copy translations from another language
     * @param language The language to update
     * @param source The source language
     */
    copyTranslations(language: IGameModelLanguage, source: IGameModelLanguage) {
      return managedModeRequest(
        LANGUAGES_BASE(gameModelId) +
          'CopyLanguage/' +
          source.code +
          '/' +
          language.code,
        {
          method: 'PUT',
        },
      );
    },

    /**
     * Clear translations
     * @param language The language to update
     * @param outdated if true, only clear outdated translations
     */
    clearTranslations(language: IGameModelLanguage, outdated: boolean) {
      return managedModeRequest(
        LANGUAGES_BASE(gameModelId) +
          'Clear/' +
          language.code +
          (outdated ? '/Outdated' : '/All'),
        {
          method: 'PUT',
        },
      );
    },

    /**
     * Change the value of a translation
     * @param translationUpdate the translation object to update
     */
    updateTranslation(translationUpdate: ITranslationUpdate | IInScriptUpdate) {
      return managedModeRequest(LANGUAGES_BASE(gameModelId) + 'Tr/MINOR', {
        method: 'PUT',
        body: JSON.stringify(translationUpdate),
      });
    },
    /**
     * Change the outadated status of a translation
     * @param translationUpdate the translation object to update
     * @param outdate if true, set the translation as outdated, if false, set translation as up to date
     */
    setTranslationStatus(
      translationUpdate: IInScriptUpdate | ITranslationUpdate,
      outdate: boolean,
    ) {
      return managedModeRequest(
        LANGUAGES_BASE(gameModelId) + `Tr/${outdate ? 'OUTDATE' : 'CATCH_UP'}`,
        {
          method: 'PUT',
          body: JSON.stringify(translationUpdate),
        },
      );
    },
    /**
     * Set all other translations status to outdated
     * @param translationUpdate the translation object to update
     */
    outdateTranslations(scriptUpdate: IInScriptUpdate | ITranslationUpdate) {
      return managedModeRequest(LANGUAGES_BASE(gameModelId) + 'Tr/MAJOR', {
        method: 'PUT',
        body: JSON.stringify(scriptUpdate),
      });
    },
    /**
     * Set all other translations status to outdated
     * @param translationUpdate the translation object to update
     */
    batchUpdateTranslations(
      translations: (IInScriptUpdate | ITranslationUpdate)[],
    ) {
      return managedModeRequest(LANGUAGES_BASE(gameModelId) + 'BatchUpdate', {
        method: 'PUT',
        body: JSON.stringify(translations),
      });
    },
  };
};

export const LanguagesAPI = LanguagesAPIFactory();
