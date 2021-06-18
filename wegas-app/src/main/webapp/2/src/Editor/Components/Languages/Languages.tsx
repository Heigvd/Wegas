import * as React from 'react';
import { MainLinearLayout } from '../LinearTabLayout/LinearLayout';
import LanguageEditor from './LanguageEditor';
// import { TranslationEditor } from './TranslationsEditor';

const LANGUAGES_LAYOUT_ID = 'LANGUAGES_LAYOUT';

export default function Languages() {
  return (
    <MainLinearLayout
      tabs={{
        'Language editor': <LanguageEditor />,
        // 'Translation manager': <TranslationEditor />,
      }}
      initialLayout={[
        'Language editor',
        // 'Translation manager'
      ]}
      layoutId={LANGUAGES_LAYOUT_ID}
      areChildren
    />
  );
}
