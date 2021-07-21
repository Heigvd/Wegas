import { TranslatableObject } from '../internalTranslator';
import { pagesTranslationsDE } from './pages-de';
import { pagesTranslationsEN } from './pages.en';
import { pagesTranslationsFR } from './pages-fr';
import { pagesTranslationsIT } from './pages-it';
import { PagesTranslations } from './definitions';

export const pagesTranslations: TranslatableObject<PagesTranslations> = {
  EN: pagesTranslationsEN,
  DE: pagesTranslationsDE,
  FR: pagesTranslationsFR,
  IT: pagesTranslationsIT,
};
