import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import Layout from './Components/Layout';
import { store } from '../data/store';

import '../css/global.css';
import { LangHandler } from '../Components/LangContext';
import { GameModel } from '../data/selectors';

function mount() {
  render(
    <Provider store={store}>
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
    </Provider>,
    document.getElementById('root'),
  );
}
mount();

if (module.hot) {
  module.hot.accept('./Components/Layout', () => {
    mount();
  });
}
