import { Player } from '../selectors';
import { ITranslatableContent } from 'wegas-ts-api';
import { STranslatableContent } from 'wegas-ts-api';

export const editorLanguages = {
  EN: 'english',
  FR: 'français',
  IT: 'italiano',
  DE: 'deutsch',
};

export type EditorLanguages = typeof editorLanguages;
export type EditorLanguagesCode = keyof EditorLanguages;

export const EditorLanguageData =  `EditorLanguageData.${CurrentGM.id}`;

export function getSavedLanguage() {
  return window.localStorage.getItem(
    EditorLanguageData,
  ) as null | EditorLanguagesCode;
}
export function getUserLanguage(): EditorLanguagesCode {
  const wegasConfig = window.localStorage.getItem(`wegas-config`);
  if (wegasConfig == null) return 'EN';
  else return String(JSON.parse(wegasConfig).commons.language).toUpperCase() as EditorLanguagesCode;
}

export const TranslatableContent = {
  /**
   * Transforms a given TranslatableContent to a string according to player choice
   *
   * @param content translatable content
   * @param code force language code
   */
  toString<
    T extends ITranslatableContent | STranslatableContent | null | undefined,
  >(content: T | null, code?: string): string {
    if (content) {
      if ('@class' in content) {
        const tr = content.translations[code || Player.selectCurrent().lang];
        return tr ? tr.translation : '';
      } else {
        // STranslatableConent
        const tr =
          content.getTranslations()[code || Player.selectCurrent().lang];
        return tr ? tr.getTranslation() : '';
      }
    }
    return '';
  },
};
