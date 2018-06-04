import * as React from 'react';
import { render } from 'react-dom';
import { LangHandler } from '../Components/LangContext';
import '../css/global.css';
import { GameModel } from '../data/selectors';
import Layout from './Components/Layout';
import { StoreProvider } from '../data/store';

function mount() {
  render(
    <StoreProvider>
      <LangHandler
        lang="def"
        availableLang={GameModel.selectCurrent().languages.map(l => ({
          refName: l.refName,
          code: l.code,
          label: l.lang,
        }))}
      >
        <Layout />
      </LangHandler>
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
