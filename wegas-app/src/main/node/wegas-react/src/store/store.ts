/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { configureStore } from '@reduxjs/toolkit';
import announcementReducer from './slices/announcement';
import initStatusReducer from './slices/initStatus';
import gameReducer from './slices/game';
import gameModelReducer from './slices/gameModel';

/**
 * New store for react-redux
 */
export const store = configureStore({
    reducer: {
        announcements: announcementReducer,
        initStatuses: initStatusReducer,
        games: gameReducer,
        gameModels: gameModelReducer,
    },
});

// Convenience dispatch for use OUTSIDE React (websocket handlers, services...).
// Inside components, prefer the typed useAppDispatch hook from ./hooks.
export const dispatch = store.dispatch;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * NOT_INITIALIZED: nothing loaded yet (may hold partial data pushed via websocket)
 * LOADING:         a request to load the data is pending
 * READY:           all data is loaded
 * ERROR:           the request failed
 */
export type LoadingStatus = 'NOT_INITIALIZED' | 'LOADING' | 'READY' | 'ERROR';
