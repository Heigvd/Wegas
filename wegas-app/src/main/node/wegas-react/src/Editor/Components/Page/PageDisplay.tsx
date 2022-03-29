import { css } from '@emotion/css';
import * as React from 'react';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { Toolbar } from '../../../Components/Toolbar';
import { defaultPadding, expandBoth, flex } from '../../../css/classes';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { pagesTranslations } from '../../../i18n/pages/pages';
import { pageCTX } from './PageEditor';
import { PageLoader } from './PageLoader';

export const PAGE_DISPLAY_ID = 'PAGE_DISPLAY_PAGE_LOADER';

const toggleButtonStyle = css({
  display: 'flex',
  padding: '0 15px 0 15px',
});

function PageEditionToolbar() {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const {
    editMode,
    showControls,
    showBorders,
    setEditMode,
    setShowControls,
    setShowBorders,
  } = React.useContext(pageCTX);
  return (
    <div className={flex}>
      {
        <Toggler
          className={toggleButtonStyle}
          label={i18nValues.pageEditor.editMode}
          value={editMode}
          onChange={() => setEditMode(!editMode)}
        />
      }
      {editMode && (
        <>
          <Toggler
            className={toggleButtonStyle}
            label={i18nValues.pageEditor.showControls}
            value={showControls}
            onChange={() => setShowControls(c => !c)}
          />
          <Toggler
            className={toggleButtonStyle}
            label={i18nValues.pageEditor.toggleBorders}
            value={showBorders}
            onChange={() => setShowBorders(b => !b)}
          />
        </>
      )}
    </div>
  );
}

export default function PageDisplay() {
  const { selectedPageId, loading } = React.useContext(pageCTX);
  const i18nValues = useInternalTranslate(pagesTranslations);

  if (loading) {
    return <pre>{i18nValues.loadingPages}</pre>;
  }
  return (
    <Toolbar className={expandBoth + ' PAGE-DISPLAY'}>
      <Toolbar.Header className={defaultPadding}>
        <PageEditionToolbar />
      </Toolbar.Header>
      <Toolbar.Content>
        <PageLoader
          id={PAGE_DISPLAY_ID}
          selectedPageId={selectedPageId}
          displayFrame
        />
      </Toolbar.Content>
    </Toolbar>
  );
}
