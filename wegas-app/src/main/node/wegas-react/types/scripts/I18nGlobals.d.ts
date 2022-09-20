interface GlobalI18nClass {
  translate: (
    translatable: STranslatableContent | ITranslatableContent,
  ) => string;
  toString: (entity: SVariableDescriptor) => string;
  createTranslatableContent: (string: string) => ITranslatableContent;
  createTranslation: (string: string) => ITranslation;
  currentLanguageCode: string;
}
