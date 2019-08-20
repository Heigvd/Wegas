/* global module*/
import * as React from 'react';
import { render } from 'react-dom';
import { LangProvider } from '../Components/LangContext';
import '../css/global.css';
import Layout from './Components/Layout';
import { Theme } from '../Components/Theme';

function mount() {
  render(
    <LangProvider>
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
