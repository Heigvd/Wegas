import { combineReducers} from 'redux';
import thunk from 'redux-thunk';
import * as stores from './Store';

import { configureStore } from '@reduxjs/toolkit';

const rootReducer = combineReducers(stores);

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(thunk),
});

export const getStore = (): typeof store => store;

export const dispatch = store.dispatch;

export type StatState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
