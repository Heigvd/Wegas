import upd from 'updeep';
import { FETCH_VARS } from '../Actions/constants/ActionTypes';
import Defiant from '../lib/defiant';

export default function variables(
    state = {
        tree: upd([], null),
        snapshot: {},
    },
    action) {
    switch (action.type) {
    case FETCH_VARS:
        return {
            tree: upd(action.data, null),
            snapshot: Defiant.getSnapshot(action.data),
        };
    default:
        return state;
    }
}
