export const TranslatableContent = {
  /**
   * Transforms a given TranslatableContent to a string
   * @param content translatable content
   * @param refName language ref
   */
  toString(content: ITranslatableContent, refName = 'def') {
    return content.translations[refName];
  },
};
