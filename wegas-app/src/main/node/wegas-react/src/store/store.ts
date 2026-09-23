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
import playersReducer from './slices/players';
import teamsReducer from './slices/teams';
import gameReducer from './slices/game';
import gameModelReducer from './slices/gameModel';
import editionReducer from './slices/edition';
import editorEventsReducer from './slices/editorEvents';
import variableDescriptorsReducer from './slices/variableDescriptors';
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
        edition: editionReducer,
        editorEvents: editorEventsReducer,
        variableDescriptors: variableDescriptorsReducer,
        variableInstances: variableInstancesReducer,
        pageContext: pageContextReducer,
        pageEditor: pageEditorReducer,
        themes: themeReducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            // `Edition` holds jsoninput schemas (functions), the FileEdition `cb`
            // callback and whole entities; WegasEvents hold exception objects. None
            // of it is serialisable, and deep-scanning a variable descriptor on
            // every dispatch is expensive on top of that.
            //
            // `pageContext` holds values returned by client scripts: any JS value,
            // including functions and class instances, and potentially large or
            // cyclic. Both dev checks walk it deeply on every dispatch, so both are
            // opted out of that branch rather than made to tolerate it.
            serializableCheck: {
                ignoredPaths: ['edition', 'editorEvents', 'pageContext'],
                ignoredActions: [
                    'pageContext/setContextValue',
                    'pageContext/setStateValue',
                ],
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
            immutableCheck: {
                ignoredPaths: ['edition', 'editorEvents', 'pageContext'],
            },
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
