import * as React from 'react';
import {render} from 'react-dom';
import AppRoute from './AppRoute';

function mount() {
  render(
    <AppRoute />, document.querySelector('body>.app')
  );
}
mount();
