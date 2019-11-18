/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { LangProvider } from '../Components/LangContext';
import '../css/global.css';
import Layout from './Components/Layout';
import { Theme } from '../Components/Theme';
import { LibrariesLoader } from './Components/LibrariesLoader';
import { ClassesProvider } from '../Components/ClassesContext';
import { FeatureProvider } from '../Components/FeatureProvider';

function mount() {
  render(
    <FeatureProvider>
      <LangProvider>
        <ClassesProvider>
          <LibrariesLoader>
            <Theme>
              <Layout />
            </Theme>
          </LibrariesLoader>
        </ClassesProvider>
      </LangProvider>
    </FeatureProvider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Components/Layout', () => {
    mount();
  });
}
