import { SHOW_OVERLAY, HIDE_OVERLAY } from './constants/ActionTypes';

export function showOverlay() {
    return {
        type: SHOW_OVERLAY,
    };
}

export function hideOverlay() {
    return {
        type: HIDE_OVERLAY,
    };
}
