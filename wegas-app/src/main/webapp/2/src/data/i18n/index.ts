import { Player } from '../selectors';
import { ITranslatableContent } from 'wegas-ts-api/typings/WegasEntities';

export const TranslatableContent = {
  /**
   * Transforms a given TranslatableContent to a string according to player choice
   * 
   * @param content translatable content
   * @param code force language code
   */
  toString(content: ITranslatableContent | null, code?: string): string {
    if (content != null) {
      const tr = content.translations[code || Player.selectCurrent().lang];
      return tr ? tr.translation : '';
    }
    return '';
  },
};
