import { Player } from '../selectors';
import { ITranslatableContent } from 'wegas-ts-api';
import { STranslatableContent } from 'wegas-ts-api';

export const TranslatableContent = {
  /**
   * Transforms a given TranslatableContent to a string according to player choice
   * 
   * @param content translatable content
   * @param code force language code
   */
  toString<T extends ITranslatableContent | STranslatableContent | null | undefined>(content: T | null, code?: string): string {
    if (content) {
      if ("@class" in content) {
        const tr = content.translations[code || Player.selectCurrent().lang];
        return tr ? tr.translation : '';
      } else {
        // STranslatableConent
        const tr = content.getTranslations()[code || Player.selectCurrent().lang];
        return tr ? tr.getTranslation() : '';
      }
    }
    return '';
  },
};
