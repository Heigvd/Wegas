/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import thunk from 'redux-thunk';
import adminReducer from './slices/admin';
import authReducer from './slices/auth';
import gameReducer from './slices/game';
import gameModelReducer from './slices/gameModel';
import notificationReducer from './slices/notification';
import playerReducer from './slices/player';
import teamReducer from './slices/team';
import userReducer from './slices/user';
import wsReducer from './slices/websocket';
import wegasReducer from './slices/wegas';

const rootReducer = combineReducers({
  auth: authReducer,
  admin: adminReducer,
  players: playerReducer,
  teams: teamReducer,
  games: gameReducer,
  gameModels: gameModelReducer,
  users: userReducer,
  notifications: notificationReducer,
  pusher: wsReducer,
  wegas: wegasReducer,
});

//const storeX = createStore(rootReducer, applyMiddleware(thunk));
const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(thunk),
});

export const getStore = (): typeof store => store;

export const dispatch = store.dispatch;

export type WegasLobbyState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
/**
 * NOT_SET: the state is not fully set. It may contain some data (received by websocket) but there
 *          is no guarantee it contains all data
 * LOADING: request to load all data is pending
 * READY:   all data are known
 */

export type LoadingStatus = 'NOT_INITIALIZED' | 'LOADING' | 'READY';
