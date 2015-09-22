import u from 'updeep';
import { BOOTSTRAP_LOGIDS, RESET, SELECT_LOGID } from '../Actions/constants/ActionTypes';

function logIds(state = u({
        status: 0,
        value: [],
        current: null
    }, null), action) {
    switch (action.type) {
        case BOOTSTRAP_LOGIDS:
            return u({
                status: 1,
                value: action.logIds
            }, state);
        case RESET:
            return u({
                status: 0,
                value: [],
                current: null
            }, state);
        case SELECT_LOGID:
            return u({
                current: action.logId
            }, state);
        default :
            return state;
    }
}

export default logIds;
