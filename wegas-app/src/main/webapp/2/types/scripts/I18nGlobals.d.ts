type STranslatableContent = import('wegas-ts-api').STranslatableContent;
type SVariableDescriptor = import('wegas-ts-api').SVariableDescriptor;
type ITranslation = import('wegas-ts-api').ITranslation;

interface GlobalI18nClass {
  translate: (translatable: STranslatableContent) => string;
  toString: (entity: SVariableDescriptor) => string;
  createTranslatableContent: (string: string) => ITranslatableContent;
  createTranslation: (string: string) => ITranslation;
  currentLanguageCode: string;
}
