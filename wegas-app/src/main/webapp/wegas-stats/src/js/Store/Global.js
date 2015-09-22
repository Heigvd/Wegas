import u from 'updeep';
import { SHOW_OVERLAY, HIDE_OVERLAY } from '../Actions/constants/ActionTypes';

const inc = x => x + 1;
const dec = x => x - 1;
const decBound = x => Math.max(dec(x), 0);

function global(state = u({
        overlay: 0
    })(null), action) {
    switch (action.type) {
        case SHOW_OVERLAY:
            return u({
                overlay: inc
            }, state);
        case HIDE_OVERLAY:
            return u({
                overlay: decBound
            }, state);
        default:
            return state;
    }
}
export default global;
