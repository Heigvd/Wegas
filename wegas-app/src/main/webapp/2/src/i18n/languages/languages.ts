import { TranslatableObject } from '../internalTranslator';
import { languagesTranslationsDE } from './languages-de';
import { languagesTranslationsEN } from './languages-en';
import { languagesTranslationsFR } from './languages-fr';
import { languagesTranslationsIT } from './languages-it';
import { LanguagesTranslations } from './definitions';

export const languagesTranslations: TranslatableObject<LanguagesTranslations> =
  {
    EN: languagesTranslationsEN,
    DE: languagesTranslationsDE,
    FR: languagesTranslationsFR,
    IT: languagesTranslationsIT,
  };
