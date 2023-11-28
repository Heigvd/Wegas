/* global module*/
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthorizationProvider } from './Components/Contexts/AuthorizationsProvider';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { FullscreenProvider } from './Components/Contexts/FullscreenContext';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { LibrariesLoader } from './Components/Contexts/LibrariesContext';
import { RoleProvider } from './Components/Contexts/RoleProvider';
import { ModalProvider } from './Components/Modal';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import { PopupManager } from './Components/PopupManager';
import { ServerStatusManager } from './Components/ServerStatusManager';
import { ThemeProvider } from './Components/Theme/Theme';
import './css/global.css';
import './data/Stores/store';
import { ErrorBoundary } from './Editor/Components/ErrorBoundary';
import './Editor/Components/FormView/index';
import Layout from './Editor/Components/Layout';
import EventInstanceManager from './Components/Contexts/EventInstanceManager';
// import { LibrariesLoader } from './Editor/Components/LibrariesLoader';

importPageComponents();

function mount() {
  const root = createRoot(document.getElementById('root')!);
  root.render(
  <ErrorBoundary>
    <AuthorizationProvider>
      <FeaturesProvider>
        <FullscreenProvider>
          <ServerStatusManager>
            <LanguagesProvider>
              <ClassesProvider>
                <LibrariesLoader>
                  <RoleProvider>
                    <ThemeProvider contextName="editor">
                      <PopupManager>
                        <ModalProvider>
                          <EventInstanceManager>
                            <Layout />
                          </EventInstanceManager>
                        </ModalProvider>
                      </PopupManager>
                    </ThemeProvider>
                  </RoleProvider>
                </LibrariesLoader>
              </ClassesProvider>
            </LanguagesProvider>
          </ServerStatusManager>
        </FullscreenProvider>
      </FeaturesProvider>
    </AuthorizationProvider>
  </ErrorBoundary>
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Editor/Components/Layout', () => {
    mount();
  });
}
