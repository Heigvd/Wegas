import * as React from 'react';
import { PageAPI } from '../../API/pages.api';
import { useWebsocketEvent } from '../../API/websocket';
import { TumbleLoader } from '../../Components/Loader';
import { defaultPageCTX, pageCTX } from './Page/PageEditor';
import {
  fullScreenLoaderStyle,
  MAIN_PAGE_EXPOSE_SIZE_AS,
  PageLoader,
} from './Page/PageLoader';

export function Player() {
  const [selectedPageId, setSelectedPageId] = React.useState<string>();

  React.useEffect(() => {
    PageAPI.getIndex().then(index => {
      if (forcedDefaultPageId) {
        setSelectedPageId(forcedDefaultPageId);
      } else {
        setSelectedPageId(index.defaultPageId);
      }
    });
  }, []);

  useWebsocketEvent('PageUpdate', () =>
    PageAPI.getIndex().then(index => {
      if (forcedDefaultPageId) {
        setSelectedPageId(forcedDefaultPageId);
      } else {
        setSelectedPageId(index.defaultPageId);
      }
    }),
  );

  if (selectedPageId == null) {
    return (
      <div className={fullScreenLoaderStyle}>
        <TumbleLoader />
      </div>
    );
  }

  return (
    <pageCTX.Provider
      value={{
        ...defaultPageCTX,
        pageIdPath: [selectedPageId],
      }}
    >
      <PageLoader
        selectedPageId={selectedPageId}
        exposeSizeAs={MAIN_PAGE_EXPOSE_SIZE_AS}
      />
    </pageCTX.Provider>
  );
}
