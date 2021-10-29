import * as React from 'react';
import { PageAPI } from '../../API/pages.api';
import { useWebsocketEvent } from '../../API/websocket';
import { TumbleLoader } from '../../Components/Loader';
import { defaultPageCTX, pageCTX } from './Page/PageEditor';
import { fullScreenLoaderStyle, PageLoader } from './Page/PageLoader';

export function Player() {
  const [selectedPageId, setSelectedPageId] = React.useState<string>();

  React.useEffect(() => {
    PageAPI.getIndex().then(index => {
      setSelectedPageId(index.defaultPageId);
    });
  }, []);

  useWebsocketEvent('PageUpdate', () =>
    PageAPI.getIndex().then(index => {
      setSelectedPageId(index.defaultPageId);
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
      <PageLoader selectedPageId={selectedPageId} />
    </pageCTX.Provider>
  );
}
