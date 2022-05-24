/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { AuthorizationProvider } from './Components/Contexts/AuthorizationsProvider';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { FullscreenProvider } from './Components/Contexts/FullscreenContext';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { LibrariesLoader } from './Components/Contexts/LibrariesContext';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import { ServerStatusManager } from './Components/ServerStatusManager';
import { ThemeProvider } from './Components/Theme/Theme';
import './css/global.css';
import './data/Stores/store';
import { Player } from './Editor/Components/Player';

importPageComponents();

function mount() {
  render(
    <AuthorizationProvider>
      <FeaturesProvider>
        <FullscreenProvider>
          <ServerStatusManager>
            <LanguagesProvider>
              <ClassesProvider>
                <LibrariesLoader>
                  <ThemeProvider contextName="player">
                    <Player />
                  </ThemeProvider>
                </LibrariesLoader>
              </ClassesProvider>
            </LanguagesProvider>
          </ServerStatusManager>
        </FullscreenProvider>
      </FeaturesProvider>
    </AuthorizationProvider>,
    document.getElementById('root'),
  );
}

mount();

// if (module.hot) {
//   module.hot.accept('./Components/Layout', () => {
//     mount();
//   });
// }
