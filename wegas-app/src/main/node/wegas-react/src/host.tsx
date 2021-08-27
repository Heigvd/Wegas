/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { LanguagesProvider } from './Components/Contexts/LanguagesProvider';
import { ThemeProvider } from './Components/Theme/Theme';
import { importPageComponents } from './Components/PageComponents/tools/componentFactory';
import './css/global.css';
import './data/Stores/store';
import HostLayout from './Host/HostLayout';
import { ClassesProvider } from './Components/Contexts/ClassesProvider';
import { FeaturesProvider } from './Components/Contexts/FeaturesProvider';
import { PopupManager } from './Components/PopupManager';
import { LibrariesLoader } from './Editor/Components/LibrariesLoader';
import { DefaultDndProvider } from './Components/Contexts/DefaultDndProvider';

importPageComponents();

function mount() {
  render(
    <FeaturesProvider>
      <LanguagesProvider>
        <ClassesProvider>
          <LibrariesLoader>
            <ThemeProvider contextName="trainer">
              <PopupManager>
                <DefaultDndProvider>
                  <HostLayout />
                </DefaultDndProvider>
              </PopupManager>
            </ThemeProvider>
          </LibrariesLoader>
        </ClassesProvider>
      </LanguagesProvider>
    </FeaturesProvider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Host/HostLayout', () => {
    mount();
  });
}
