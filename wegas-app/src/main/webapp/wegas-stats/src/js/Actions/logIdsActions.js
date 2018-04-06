import { getLogIds } from '../API/neo4j';
import { BOOTSTRAP_LOGIDS, SELECT_LOGID } from './constants/ActionTypes';
import { fetchGamesForLogId } from './gamesActions';
import { startRequest, endRequest } from './glabal';

export function bootstrapLogIds() {
    return dispatch => {
        dispatch(startRequest());
        getLogIds()
            .then(value => {
                dispatch({
                    type: BOOTSTRAP_LOGIDS,
                    logIds: value,
                });
            })
            .then(() => dispatch(endRequest()))
            .catch(() => dispatch(endRequest()));
    };
}

export function selectLogId(logId) {
    return dispatch => {
        dispatch({
            type: SELECT_LOGID,
            logId,
        });
        dispatch(fetchGamesForLogId())
    };
}
