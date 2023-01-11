/* global module*/
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthorizationProvider } from './Components/Contexts/AuthorizationsProvider';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { FullscreenProvider } from './Components/Contexts/FullscreenContext';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import PlayerLibrariesLoader from './Components/Contexts/PlayerLibrariesLoader';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import { ServerStatusManager } from './Components/ServerStatusManager';
import { ThemeProvider } from './Components/Theme/Theme';
import './css/global.css';
import './data/Stores/store';
import { Player } from './Editor/Components/Player';

importPageComponents();

function mount() {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <AuthorizationProvider>
      <FeaturesProvider>
        <FullscreenProvider>
          <ServerStatusManager>
            <LanguagesProvider>
              <ClassesProvider>
                <PlayerLibrariesLoader>
                  <ThemeProvider contextName="player">
                    <Player />
                  </ThemeProvider>
                </PlayerLibrariesLoader>
              </ClassesProvider>
            </LanguagesProvider>
          </ServerStatusManager>
        </FullscreenProvider>
      </FeaturesProvider>
    </AuthorizationProvider>,
  );
}

mount();

// if (module.hot) {
//   module.hot.accept('./Components/Layout', () => {
//     mount();
//   });
// }
