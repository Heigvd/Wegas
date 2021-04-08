export interface TranslatableObject<T> {
  [lang: string]: T;
}

export function internalTranslate<Translations>(
  translatableObject: TranslatableObject<Translations>,
  lang?: string,
): Translations {
  return (
    (lang && translatableObject[lang]) ||
    translatableObject['EN'] ||
    translatableObject[Object.keys(translatableObject)[0]]
  );
}
