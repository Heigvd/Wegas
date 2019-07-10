/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { LangProvider } from '../Components/LangContext';
import '../css/global.css';
import { GameModel } from '../data/selectors';
import Layout from './Components/Layout';
import { Theme } from '../Components/Theme';
import { LibrariesLoader } from '../Components/LibrariesLoader';

function mount() {
  render(
    <LangProvider availableLang={GameModel.selectCurrent().languages}>
      <LibrariesLoader />
      <Theme>
        <Layout />
      </Theme>
    </LangProvider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Components/Layout', () => {
    mount();
  });
}
