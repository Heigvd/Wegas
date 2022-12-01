import { editorTabsTranslationsDE } from './editorTabs-de';
import { editorTabsTranslationsEN } from './editorTabs-en';
import { editorTabsTranslationsFR } from './editorTabs-fr';
import { editorTabsTranslationsIT } from './editorTabs-it';

export type EditorTabsTranslations = typeof editorTabsTranslationsEN;

export const editorTabsTranslations: TranslatableObject<EditorTabsTranslations> =
  {
    EN: editorTabsTranslationsEN,
    DE: editorTabsTranslationsDE,
    FR: editorTabsTranslationsFR,
    IT: editorTabsTranslationsIT,
  };
