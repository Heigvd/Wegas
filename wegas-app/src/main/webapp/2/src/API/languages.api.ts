import { managedModeRequest, rest } from './rest';
import { GameModel } from '../data/selectors';
import { IGameModelLanguage, IGameModel } from 'wegas-ts-api';

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
     * @param languageCode The code of the tranlations's language
     * @param translationId The id of the translation to update
     * @param translationValue The value to set in the translation
     */
    updateTranslation(
      languageCode: string,
      translationId: number,
      translationValue: string,
    ) {
      return managedModeRequest(LANGUAGES_BASE(gameModelId) + 'Tr/MINOR', {
        method: 'PUT',
        body: JSON.stringify({
          '@class': 'TranslationUpdate',
          code: languageCode,
          trId: translationId,
          value: translationValue,
        }),
      });
    },
    /**
     * Change the value of a translation in a script
     * @param languageCode The code of the tranlations's language
     * @param fieldName The name of the script method
     * @param index The index of the modified argument
     * @param parentClass The class of the parent of the script field
     * @param parentId THe id of the parent
     * @param translationValue The value to set in the translation
     * @returns
     */
    updateScript(
      languageCode: string,
      fieldName: string,
      index: number,
      parentClass: string,
      parentId: number,
      translationValue: string,
    ) {
      return managedModeRequest(LANGUAGES_BASE(gameModelId) + 'Tr/MINOR', {
        method: 'PUT',
        body: JSON.stringify({
          '@class': 'InScriptUpdate',
          code: languageCode,
          fieldName,
          index,
          parentClass,
          parentId,
          value: translationValue,
        }),
      });
    },
    /**
     * Change the outadated status of a translation
     * @param languageCode The code of the tranlations's language
     * @param translationId The id of the translation to update
     * @param translationValue The value to set in the translation
     * @param outdate if true, set the translation as outdated, if false, set translation as up to date
     */
    setTranslationStatus(
      languageCode: string,
      translationId: number,
      translationValue: string,
      outdate: boolean,
    ) {
      return managedModeRequest(
        LANGUAGES_BASE(gameModelId) + `Tr/${outdate ? 'OUTDATE' : 'CATCH_UP'}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            '@class': 'TranslationUpdate',
            code: languageCode,
            trId: translationId,
            value: translationValue,
          }),
        },
      );
    },
    /**
     * Change the outadated status of a translation
     * @param languageCode The code of the tranlations's language
     * @param fieldName The name of the script method
     * @param index The index of the modified argument
     * @param parentClass The class of the parent of the script field
     * @param parentId THe id of the parent
     * @param translationValue The value to set in the translation
     * @param outdate if true, set the translation as outdated, if false, set translation as up to date
     */
    setScriptStatus(
      languageCode: string,
      fieldName: string,
      index: number,
      parentClass: string,
      parentId: number,
      translationValue: string,
      outdate: boolean,
    ) {
      return managedModeRequest(
        LANGUAGES_BASE(gameModelId) + `Tr/${outdate ? 'OUTDATE' : 'CATCH_UP'}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            '@class': 'InScriptUpdate',
            code: languageCode,
            fieldName,
            index,
            parentClass,
            parentId,
            value: translationValue,
          }),
        },
      );
    },

    /**
     * Set all other translations status to outdated
     * @param languageCode The code of the tranlations's language
     * @param translationId The id of the translation to update
     * @param translationValue The value to set in the translation
     */
    outdateTranslations(
      languageCode: string,
      translationId: number,
      translationValue: string,
    ) {
      return managedModeRequest(LANGUAGES_BASE(gameModelId) + 'Tr/MAJOR', {
        method: 'PUT',
        body: JSON.stringify({
          '@class': 'TranslationUpdate',
          code: languageCode,
          trId: translationId,
          value: translationValue,
        }),
      });
    },
    /**
     * Set all other translations status to outdated
     * @param languageCode The code of the tranlations's language
     * @param fieldName The name of the script method
     * @param index The index of the modified argument
     * @param parentClass The class of the parent of the script field
     * @param parentId THe id of the parent
     * @param translationValue The value to set in the translation
     */ outdateScripts(
      languageCode: string,
      fieldName: string,
      index: number,
      parentClass: string,
      parentId: number,
      translationValue: string,
    ) {
      return managedModeRequest(LANGUAGES_BASE(gameModelId) + 'Tr/MAJOR', {
        method: 'PUT',
        body: JSON.stringify({
          '@class': 'InScriptUpdate',
          code: languageCode,
          fieldName,
          index,
          parentClass,
          parentId,
          value: translationValue,
        }),
      });
    },
  };
};

export const LanguagesAPI = LanguagesAPIFactory();
