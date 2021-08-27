import {
FETCH_GAMES,
    FETCH_VARS,
    FETCH_GAMES_LOGID,
    } from './constants/ActionTypes';
import { getGameForLogId } from '../API/neo4j';
import { getGameModelForGame, getVariables, getGamesByIds } from '../API/wegas';
import { startRequest, endRequest } from './glabal';

export function fetchGamesForLogId() {
    return (dispatch, getState) => {
        dispatch(startRequest());
        getGameForLogId(getState().logIds.current)
            .then(value => {
                // value is the list if game which match the given logId
                dispatch(startRequest());
                // load the list of GameAdmin based on this list
                getGamesByIds(value)
                    .then(res =>
                        dispatch({
                            type: FETCH_GAMES,
                            data: res,
                        })
                    )
                    .then(() => dispatch(endRequest()))
                    .catch(() => dispatch(endRequest()));

                return dispatch({
                    type: FETCH_GAMES_LOGID,
                    data: value,
                })
            })
            .then(() => dispatch(endRequest()))
            .catch(() => dispatch(endRequest()));
    };
}

export function fetchVariables(gameId) {
    return dispatch => {
        dispatch(startRequest());
        getGameModelForGame(gameId)
            .then(gmId => getVariables(gmId))
            .then(data =>
                dispatch({
                    type: FETCH_VARS,
                    data: data,
                })
            )
            .then(() => dispatch(endRequest()))
            .catch(() => dispatch(endRequest()));
    };
}
