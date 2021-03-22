/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { LibrariesLoader } from './Editor/Components/LibrariesLoader';
import { ThemeProvider } from './Components/Style/Theme';
import { PageAPI } from './API/pages.api';
import 'emotion';
import { useWebsocket } from './API/websocket';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import { PageLoader } from './Editor/Components/Page/PageLoader';
import { pageCTX, defaultPageCTX } from './Editor/Components/Page/PageEditor';

importPageComponents();

function PlayerPageLoader() {
  const [selectedPageId, setSelectedPageId] = React.useState<string>();

  React.useEffect(() => {
    PageAPI.getIndex().then(index => {
      setSelectedPageId(index.defaultPageId);
    });
  }, []);

  useWebsocket('PageUpdate', () =>
    PageAPI.getIndex().then(index => {
      setSelectedPageId(index.defaultPageId);
    }),
  );

  if (selectedPageId == null) {
    return <pre>No page selected</pre>;
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
