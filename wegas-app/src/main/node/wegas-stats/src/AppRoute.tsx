import React from 'react';
import {HashRouter, Route, Routes, useParams} from 'react-router-dom';
import {Provider} from 'react-redux';
import {getStore} from './js/init';
import App from './js/Comps/App';
import LogIdSelector from './js/Comps/LogIdSelector';
import Stats from './js/Comps/Stats';
import ErrorBoundary from './js/Comps/ErrorBoundary';

function StatWrapper() {
  const { logId: logId } = useParams<{ logId: string }>();

  return <Stats logId={logId || ''}/>
}

export default function AppRoute(): JSX.Element {

  return (
    <ErrorBoundary>
      <Provider store={getStore()}>
        <HashRouter>
          <div>
            <App />
            <Routes>
              <Route element={<StatWrapper/>} path="/:logId" />
              <Route path="/" element={<LogIdSelector/>} />
            </Routes>
          </div>
        </HashRouter>
      </Provider>
    </ErrorBoundary>
  );
}
