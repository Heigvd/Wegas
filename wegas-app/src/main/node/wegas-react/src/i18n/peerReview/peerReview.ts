import { PeerReviewTranslations } from './definitions';
import { peerReviewTranslationsDE } from './peerReview-de';
import { peerReviewTranslationsEN } from './peerReview-en';
import { peerReviewTranslationsFR } from './peerReview-fr';
import { peerReviewTranslationsIT } from './peerReview-it';

export const peerReviewTranslations: TranslatableObject<PeerReviewTranslations> =
  {
    EN: peerReviewTranslationsEN,
    DE: peerReviewTranslationsDE,
    FR: peerReviewTranslationsFR,
    IT: peerReviewTranslationsIT,
  };
