/* global module*/
import '@emotion/css';
import * as React from 'react';
import { render } from 'react-dom';
import { PageAPI } from './API/pages.api';
import { useWebsocketEvent } from './API/websocket';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { TumbleLoader } from './Components/Loader';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import { ThemeProvider } from './Components/Theme/Theme';
import './css/global.css';
import { LibrariesLoader } from './Editor/Components/LibrariesLoader';
import { defaultPageCTX, pageCTX } from './Editor/Components/Page/PageEditor';
import {
  fullScreenLoaderStyle,
  PageLoader,
} from './Editor/Components/Page/PageLoader';

importPageComponents();

function PlayerPageLoader() {
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
    <ThemeProvider contextName="player">
      <pageCTX.Provider
        value={{
          ...defaultPageCTX,
          pageIdPath: [selectedPageId],
        }}
      >
        <PageLoader selectedPageId={selectedPageId} />
      </pageCTX.Provider>
    </ThemeProvider>
  );
}

function mount() {
  render(
    <FeaturesProvider>
      <LanguagesProvider>
        <ClassesProvider>
          <LibrariesLoader>
            <ThemeProvider contextName="player">
              <PlayerPageLoader />
            </ThemeProvider>
          </LibrariesLoader>
        </ClassesProvider>
      </LanguagesProvider>
    </FeaturesProvider>,
    document.getElementById('root'),
  );
}
mount();

// if (module.hot) {
//   module.hot.accept('./Components/Layout', () => {
//     mount();
//   });
// }
