import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import * as stores from './Store';
import { bootstrapUser } from './Actions/userActions';
import { fetchGames } from './Actions/gamesActions';

export const store = applyMiddleware(thunk)(createStore)(combineReducers(stores));

store.dispatch(bootstrapUser());
store.dispatch(fetchGames());
