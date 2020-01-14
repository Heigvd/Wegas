/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { LibrariesLoader } from './Editor/Components/LibrariesLoader';
import { ThemeProvider } from './Components/Theme';
import { PageLoader } from './Editor/Components/Page/PageLoader';
import { PageAPI } from './API/pages.api';
import { GameModel } from './data/selectors';
import { useWebsocket } from './API/websocket';
import 'emotion';

// Importing all the files containing ".component." to allow component registration without explicit import
const componentModules = require.context(
  './',
  true,
  /\.component\./,
  'lazy-once',
);
componentModules.keys().map(k => componentModules(k));

function PlayerPageLoader() {
  const [selectedPage, setSelectedPage] = React.useState<Page>();
  if (selectedPage === undefined) {
    PageAPI.get(GameModel.selectCurrent().id!, '1', true).then(res => {
      setSelectedPage(Object.values(res)[0]);
    });
  }
  useWebsocket('PageUpdate', () =>
    PageAPI.get(GameModel.selectCurrent().id!, '1', true).then(res => {
      setSelectedPage(Object.values(res)[0]);
    }),
  );
  return (
    <ThemeProvider contextName="player">
      {selectedPage && <PageLoader selectedPage={selectedPage} />}
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
