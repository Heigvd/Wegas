import React from 'react';
import {HashRouter, Route} from 'react-router-dom';
import {Provider} from 'react-redux';
import {getStore} from './js/init';
import App from './js/Comps/App';
import LogIdSelector from './js/Comps/LogIdSelector';
import Stats from './js/Comps/Stats';
import ErrorBoundary from './js/Comps/ErrorBoundary';


export default function AppRoute(): JSX.Element {

  return (
    <ErrorBoundary>
      <Provider store={getStore()}>
        <HashRouter>
          <div>
            <App />
            <Route exact path="/" component={LogIdSelector} />
            <Route component={Stats} path="/:LogId" />
          </div>
        </HashRouter>
      </Provider>
    </ErrorBoundary>
  );
}
