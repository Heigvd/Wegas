import { getCurrentUser, login, logout } from '../API/user';
import { BOOTSTRAP_USER } from './constants/ActionTypes';
import { bootstrapLogIds } from './logIdsActions';

export function bootstrapUser() {
    return (dispatch, getState) => {
        getCurrentUser().then((v) => {
            dispatch({
                type: BOOTSTRAP_USER,
                user: v
            });
        }).then(() => {
            if (getState().user.isLoggedIn) {
                dispatch(bootstrapLogIds());
            }
        });
    };
}

export function userLogin(username, password) {

    return (dispatch, getState) => {
        login(username, password).then(res => dispatch({
                type: BOOTSTRAP_USER,
                user: res
            })).then(() => {
            if (getState().user.isLoggedIn) {
                dispatch(bootstrapLogIds());
            }
        });
    };
}

export function userLogout() {
    return dispatch => {
        logout().then(() => dispatch(bootstrapUser()));
    };
}
