import {
    SHOW_OVERLAY,
    HIDE_OVERLAY,
    START_REQUEST,
    END_REQUEST,
} from './constants/ActionTypes';

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
export function startRequest() {
    return {
        type: START_REQUEST,
    };
}

export function endRequest() {
    return {
        type: END_REQUEST,
    };
}
