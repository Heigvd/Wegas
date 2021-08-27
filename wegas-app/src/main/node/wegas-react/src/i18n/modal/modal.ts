import { ModalTranslations } from './definitions';
import { modalTranslationsDE } from './modal-de';
import { modalTranslationsEN } from './modal-en';
import { modalTranslationsFR } from './modal-fr';
import { modalTranslationsIT } from './modal-it';

export const modalTranslations: TranslatableObject<ModalTranslations> = {
  EN: modalTranslationsEN,
  DE: modalTranslationsDE,
  FR: modalTranslationsFR,
  IT: modalTranslationsIT,
};
