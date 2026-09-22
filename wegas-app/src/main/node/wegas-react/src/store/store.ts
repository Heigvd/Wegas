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
import playersReducer from './slices/players';
import teamsReducer from './slices/teams';
import gameReducer from './slices/game';
import gameModelReducer from './slices/gameModel';
import variableInstancesReducer from './slices/variableInstances';
import pageContextReducer from './slices/pageContext';
import pageEditorReducer from './slices/pageEditor';
import themeReducer from './slices/theme';

/**
 * New store for react-redux
 */
export const store = configureStore({
    reducer: {
        announcements: announcementReducer,
        initStatuses: initStatusReducer,
        players: playersReducer,
        teams: teamsReducer,
        games: gameReducer,
        gameModels: gameModelReducer,
        variableInstances: variableInstancesReducer,
        pageContext: pageContextReducer,
        pageEditor: pageEditorReducer,
        themes: themeReducer
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            // `pageContext` holds values returned by client scripts: any JS value,
            // including functions and class instances, and potentially large or
            // cyclic. Both dev checks walk it deeply on every dispatch, so both are
            // opted out of that branch rather than made to tolerate it.
            serializableCheck: {
                ignoredPaths: ['pageContext'],
                ignoredActions: [
                    'pageContext/setContextValue',
                    'pageContext/setStateValue',
                ],
            },
            immutableCheck: { ignoredPaths: ['pageContext'] },
        }),
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
