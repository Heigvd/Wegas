import { getLogIds } from '../API/neo4j';
import { BOOTSTRAP_LOGIDS, SELECT_LOGID } from './constants/ActionTypes';
import { fetchGamesForLogId } from './gamesActions';

export function bootstrapLogIds() {
    return dispatch => {
        getLogIds().then((v) => {
            dispatch({
                type: BOOTSTRAP_LOGIDS,
                logIds: v
            });
        });
    };
}

export function selectLogId(logId) {
    return (dispatch) => {
        dispatch({
            type: SELECT_LOGID,
            logId
        });
        dispatch(fetchGamesForLogId());
    };
}
