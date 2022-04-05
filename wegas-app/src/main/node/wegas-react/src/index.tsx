/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
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
import Layout from './Editor/Components/Layout';
import "./Editor/Components/FormView/index";
// import { LibrariesLoader } from './Editor/Components/LibrariesLoader';

importPageComponents();

function mount() {
  render(
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
                        <Layout />
                      </ModalProvider>
                    </PopupManager>
                  </ThemeProvider>
                </RoleProvider>
              </LibrariesLoader>
            </ClassesProvider>
          </LanguagesProvider>
        </ServerStatusManager>
      </FullscreenProvider>
    </FeaturesProvider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Editor/Components/Layout', () => {
    mount();
  });
}
