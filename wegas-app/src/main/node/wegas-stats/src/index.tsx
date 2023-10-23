import * as React from 'react';
import {createRoot} from 'react-dom/client';
import AppRoute from './AppRoute';

function mount() {
    const root = createRoot(document.querySelector('body>.app')!);
    root.render(<AppRoute />);
}
mount();
