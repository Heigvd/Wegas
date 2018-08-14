export const TranslatableContent = {
  /**
   * Transforms a given TranslatableContent to a string
   * @param content translatable content
   * @param refName language ref
   */
  toString(content: ITranslatableContent | null, refName = 'def') {
    if (content == null) {
      return '';
    }
    return content.translations[refName];
  },
};
