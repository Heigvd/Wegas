import { BOOTSTRAP_USER } from '../Actions/constants/ActionTypes';
const defaultState = {
    isLoggedIn: false
};
function user(state = defaultState, action) {
    switch (action.type) {
    case BOOTSTRAP_USER:
        return action.user;
    default:
        return state;
    }
}

export default user;
