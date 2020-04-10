/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { LibrariesLoader } from './Editor/Components/LibrariesLoader';
import { ThemeProvider } from './Components/Theme';
import { PageIdLoader } from './Editor/Components/Page/PageLoader';
import { PageAPI } from './API/pages.api';
import 'emotion';
import { useWebsocket } from './API/websocket';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';

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

  return (
    <ThemeProvider contextName="player">
      {selectedPageId ? (
        <PageIdLoader selectedPageId={selectedPageId} />
      ) : (
        <pre>No given pageId</pre>
      )}
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
