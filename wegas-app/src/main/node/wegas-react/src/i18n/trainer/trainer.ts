import { trainerTranslationsDE } from './trainer-de';
import { trainerTranslationsEN } from './trainer-en';
import { trainerTranslationsFR } from './trainer-fr';
import { trainerTranslationsIT } from './trainer-it';
import { TrainerTranslations } from './definitions';

export const trainerTranslations: TranslatableObject<TrainerTranslations> = {
  EN: trainerTranslationsEN,
  DE: trainerTranslationsDE,
  FR: trainerTranslationsFR,
  IT: trainerTranslationsIT,
};
