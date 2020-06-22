/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { LanguagesProvider } from '../Components/Contexts/LanguagesProvider';
import '../css/global.css';
import Layout from './Components/Layout';
import { LibrariesLoader } from './Components/LibrariesLoader';
import { ClassesProvider } from '../Components/Contexts/ClassesProvider';
import { FeaturesProvider } from '../Components/Contexts/FeaturesProvider';
import { ThemeProvider } from '../Components/Style/Theme';
import '../data/store';
import { importPageComponents } from '../Components/PageComponents/tools/componentFactory';

importPageComponents();

function mount() {
  render(
    <FeaturesProvider>
      <LanguagesProvider>
        <ClassesProvider>
          <LibrariesLoader>
            <ThemeProvider contextName="editor">
              <Layout />
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
  module.hot.accept('./Components/Layout', () => {
    mount();
  });
}
