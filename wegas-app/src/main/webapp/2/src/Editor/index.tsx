import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import Layout from './Components/Layout';
import { store } from '../data/store';

import '../css/global.css';

function mount() {
  render(
    <Provider store={store}>
      <Layout />
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
