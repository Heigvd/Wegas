import updeep from 'updeep';
import {
    SHOW_OVERLAY,
    HIDE_OVERLAY,
    START_REQUEST,
    END_REQUEST,
} from '../Actions/constants/ActionTypes';

const inc = val => val + 1;
const dec = val => val - 1;
const decBound = val => Math.max(dec(val), 0);
const defaultState = {
    overlay: 0,
    request: 0,
};
function global(state = updeep(defaultState)(null), action) {
    switch (action.type) {
        case SHOW_OVERLAY:
            return updeep(
                {
                    overlay: inc,
                },
                state
            );
        case HIDE_OVERLAY:
            return updeep(
                {
                    overlay: decBound,
                },
                state
            );
        case START_REQUEST:
            return updeep(
                {
                    request: inc,
                },
                state
            );
        case END_REQUEST:
            return updeep(
                {
                    request: decBound,
                },
                state
            );
        default:
            return state;
    }
}

export default global;
