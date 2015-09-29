import { BOOTSTRAP_USER } from '../Actions/constants/ActionTypes';

function user(state = {
        isLoggedIn: false
    }, action) {
    switch (action.type) {
        case BOOTSTRAP_USER :
            return action.user;
        default :
            return state;
    }
}

export default user;
