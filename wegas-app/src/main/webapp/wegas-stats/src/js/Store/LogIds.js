import updeep from 'updeep';
import { BOOTSTRAP_LOGIDS, RESET, SELECT_LOGID } from '../Actions/constants/ActionTypes';
const defaultState = {
    status: 0,
    value: [],
    current: null,
};
function logIds(state = updeep(defaultState)(null), action) {
    switch (action.type) {
    case BOOTSTRAP_LOGIDS:
        return updeep({
            status: 1,
            value: action.logIds,
        }, state);
    case RESET:
        return updeep({
            status: 0,
            value: [],
            current: null,
        }, state);
    case SELECT_LOGID:
        return updeep({
            current: action.logId,
        }, state);
    default:
        return state;
    }
}

export default logIds;
