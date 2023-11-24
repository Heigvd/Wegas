/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { Suspense } from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Route, Routes, useParams } from 'react-router-dom';
import { I18nCtx, Language } from '../i18n/I18nContext';
import { useLocalStorageState } from '../preferences';
import { getStore } from '../store/store';
import ErrorBoundary from './common/ErrorBoundary';
import Loading from './common/Loading';
import Notifier from './common/Notifier';
import MainApp from './MainApp';
import AutoPlay from './token/AutoPlay';
import Token from './token/Token';

import { createRoot } from 'react-dom/client';

import 'inter-ui/inter.css';

/**
 * To read parameters from hash
 */
function TokenWrapper() {
  const { id, token } = useParams<'id' | 'token'>();

  // transform "0" to undefined
  const nId = id ? +id : undefined;

  return <Token accountId={nId} hash={token || ''} />;
}

function PlayWrapper() {
  const { token } = useParams<{ token: string }>();

  return <AutoPlay token={token || ''} />;
}

function App() {
  const [lang, setLang] = useLocalStorageState<Language>('wegas-ui-language', 'EN');
  const setLangCb = React.useCallback(setLang, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Provider store={getStore()}>
          <I18nCtx.Provider value={{ lang: lang, setLang: setLangCb }}>
            <Notifier />
            <HashRouter>
              <Routes>
                <Route path="/token/:id/:token" element={<TokenWrapper/>}/>
                <Route path="/play/:token" element={<PlayWrapper/>}/>
                <Route path="*" element={<MainApp/>}/>
              </Routes>
            </HashRouter>
          </I18nCtx.Provider>
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

function mount() {
  const root = createRoot(document.getElementById('root')!); // createRoot(container!) if you use TypeScript
  root.render(<App/>);
}
mount();
