import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import * as stores from './Store';
import { bootstrapUser } from './Actions/userActions';
import { fetchGames } from './Actions/gamesActions';
import Axios from 'axios';
/*global config*/
Axios.interceptors.request.use(function(cfg) {
    cfg.url = `${config ? config.contextPath : '/Wegas'}${cfg.url}`;
    return cfg;
});

export const store = applyMiddleware(thunk)(createStore)(combineReducers(stores));

store.dispatch(bootstrapUser());
store.dispatch(fetchGames());
