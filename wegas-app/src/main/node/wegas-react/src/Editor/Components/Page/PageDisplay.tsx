import { css } from '@emotion/css';
import * as React from 'react';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { Toolbar } from '../../../Components/Toolbar';
import {
  defaultTooboxLabelContainerStyle,
  defaultToolboxButtonContainerStyle,
  defaultToolboxHeaderStyle,
  defaultToolboxLabelStyle,
  expandBoth,
} from '../../../css/classes';
import { useStore } from '../../../data/Stores/store';
import { getPageIndexItemFromFolder } from '../../../Helper/pages';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { pagesTranslations } from '../../../i18n/pages/pages';
import { pageCTX } from './PageEditor';
import { PageLoader } from './PageLoader';

const toggleButtonStyle = css({
  display: 'flex',
  padding: '0 15px 0 15px',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
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
    <div className={defaultToolboxButtonContainerStyle}>
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
  const indexPage = useStore(s => {
    if (s.pages.index) {
      return getPageIndexItemFromFolder(s.pages.index.root, selectedPageId);
    } else {
      return undefined;
    }
  }, deepDifferent);

  if (loading) {
    return <pre>{i18nValues.loadingPages}</pre>;
  }
  return (
    <Toolbar className={expandBoth + ' PAGE-DISPLAY'}>
      <Toolbar.Header className={defaultToolboxHeaderStyle}>
        <div className={defaultTooboxLabelContainerStyle}>
          <h3 className={defaultToolboxLabelStyle}>{indexPage?.name}</h3>
        </div>
        <PageEditionToolbar />
      </Toolbar.Header>
      <Toolbar.Content>
        <PageLoader selectedPageId={selectedPageId} />
      </Toolbar.Content>
    </Toolbar>
  );
}
