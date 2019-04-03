import * as React from 'react';
import { render } from 'react-dom';
import { LangProvider } from '../Components/LangContext';
import '../css/global.css';
import { GameModel } from '../data/selectors';
import Layout from './Components/Layout';
import { StoreProvider } from '../data/store';
import { Theme } from '../Components/Theme';

function mount() {
  render(
    <StoreProvider>
      <LangProvider
        availableLang={GameModel.selectCurrent().languages.map(l => ({
          code: l.code,
          label: l.lang,
          active: l.active,
        }))}
      >
        <Theme>
          <Layout />
        </Theme>
      </LangProvider>
    </StoreProvider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Components/Layout', () => {
    mount();
  });
}
