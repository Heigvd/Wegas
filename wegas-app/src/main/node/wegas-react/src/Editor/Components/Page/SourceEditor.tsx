import * as React from 'react';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { useStore } from '../../../data/Stores/store';
import { getPageIndexItemFromFolder } from '../../../Helper/pages';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { pagesTranslations } from '../../../i18n/pages/pages';
import { JSONandJSEditor } from '../ScriptEditors/JSONandJSEditor';
import { pageCTX, patchPage } from './PageEditor';

export default function SourceEditor() {
  const { loading, selectedPage, selectedPageId } = React.useContext(pageCTX);
  const indexPage = useStore(
    s => getPageIndexItemFromFolder(s.pages.index.root, selectedPageId),
    deepDifferent,
  );
  const i18nValues = useInternalTranslate(pagesTranslations);
  if (loading) {
    return <pre>{i18nValues.loadingPages}</pre>;
  } else {
    return (
      <JSONandJSEditor
        label={indexPage?.name || 'No selected page'}
        content={JSON.stringify(selectedPage, null, 2)}
        onSave={content => {
          try {
            if (selectedPageId) {
              patchPage(selectedPageId, JSON.parse(content));
            } else {
              throw Error(i18nValues.noSelectedPage);
            }
          } catch (e) {
            return { status: 'error', text: (e as Error).message };
          }
        }}
      />
    );
  }
}
