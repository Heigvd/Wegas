import * as React from 'react';
import { MainLinearLayout } from '../../../Components/LinearTabLayout/LinearLayout';
import { tabLayoutChildrenClassNames } from '../../../Components/TabLayout/tabLayoutStyles';
import LanguageEditor from './LanguageEditor';
import { TranslationEditor } from './TranslationsEditor';

const LANGUAGES_LAYOUT_ID = 'LANGUAGES_LAYOUT';

export default function Languages() {
  return (
    <MainLinearLayout
      tabs={[
        { tabId: 'Language editor', content: <LanguageEditor /> },
        { tabId: 'Translation manager', content: <TranslationEditor /> },
      ]}
      initialLayout={['Language editor', 'Translation manager']}
      layoutId={LANGUAGES_LAYOUT_ID}
      classNames={tabLayoutChildrenClassNames}
    />
  );
}
