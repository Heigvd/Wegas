/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { configureStore, ThunkAction } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';
import announcementReducer from './slices/announcement';
import initStatusReducer from './slices/initStatus';
import gameReducer from './slices/game';
import gameModelReducer from './slices/gameModel';
import editionReducer from './slices/edition';
import editorEventsReducer from './slices/editorEvents';

/**
 * New store for react-redux
 */
export const store = configureStore({
    reducer: {
        announcements: announcementReducer,
        initStatuses: initStatusReducer,
        games: gameReducer,
        gameModels: gameModelReducer,
        edition: editionReducer,
        editorEvents: editorEventsReducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            // `Edition` holds jsoninput schemas (functions), the FileEdition `cb`
            // callback and whole entities; WegasEvents hold exception objects. None
            // of it is serialisable, and deep-scanning a variable descriptor on
            // every dispatch is expensive on top of that.
            serializableCheck: {
                ignoredPaths: ['edition', 'editorEvents'],
                ignoredActionPaths: [
                    'payload.config',
                    'payload.cb',
                    'payload.entity',
                    'payload.instance',
                    'payload.newEntity',
                    'payload.events',
                    'payload.updatedEntities',
                    'payload.deletedEntities',
                ],
            },
            immutableCheck: { ignoredPaths: ['edition', 'editorEvents'] },
        }),
});

// Convenience dispatch for use OUTSIDE React (websocket handlers, services...).
// Inside components, prefer the typed useAppDispatch hook from ./hooks.
export const dispatch = store.dispatch;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * A thunk running against the single app store.
 *
 * Also the type of thunks dispatched into a component-local edition scope: that
 * scope's dispatch hands them a complete RootState with only `edition` swapped
 * for its own (see ./localEdition), so they never need to know where they run.
 */
export type AppThunk<R = void> = ThunkAction<R, RootState, undefined, AnyAction>;

/**
 * NOT_INITIALIZED: nothing loaded yet (may hold partial data pushed via websocket)
 * LOADING:         a request to load the data is pending
 * READY:           all data is loaded
 * ERROR:           the request failed
 */
export type LoadingStatus = 'NOT_INITIALIZED' | 'LOADING' | 'READY' | 'ERROR';
