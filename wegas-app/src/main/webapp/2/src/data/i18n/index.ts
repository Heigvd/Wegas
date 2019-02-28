export const TranslatableContent = {
  /**
   * Transforms a given TranslatableContent to a string
   * @param content translatable content
   * @param refName language ref
   */
  toString(content: ITranslatableContent | null, refName = 'DEF') {
    if (content == null || content.translations[refName] == null) {
      return '';
    }
    return content.translations[refName].translation;
  },
};
