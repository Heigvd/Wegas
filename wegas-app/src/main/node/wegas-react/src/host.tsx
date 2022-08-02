/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { AuthorizationProvider } from './Components/Contexts/AuthorizationsProvider';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { DefaultDndProvider } from './Components/Contexts/DefaultDndProvider';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { FullscreenProvider } from './Components/Contexts/FullscreenContext';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { LibrariesLoader } from './Components/Contexts/LibrariesContext';
import { PageContextProvider } from './Components/Page/PageEditor';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import { PopupManager } from './Components/PopupManager';
import { ServerStatusManager } from './Components/ServerStatusManager';
import { ThemeProvider } from './Components/Theme/Theme';
import './css/global.css';
import './data/Stores/store';
import HostLayout from './Host/HostLayout';

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
                  <ThemeProvider contextName="trainer">
                    <PopupManager>
                      <DefaultDndProvider>
                        <PageContextProvider>
                          <HostLayout />
                        </PageContextProvider>
                      </DefaultDndProvider>
                    </PopupManager>
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

if (module.hot) {
  module.hot.accept('./Host/HostLayout', () => {
    mount();
  });
}
