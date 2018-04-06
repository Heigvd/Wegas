import {
    FETCH_GAMES,
    FETCH_VARS,
    FETCH_GAMES_LOGID,
} from './constants/ActionTypes';
import { getGameForLogId } from '../API/neo4j';
import { getGameModelForGame, getVariables, getGames } from '../API/wegas';
import { startRequest, endRequest } from './glabal';

export function fetchGamesForLogId() {
    return (dispatch, getState) => {
        dispatch(startRequest());
        getGameForLogId(getState().logIds.current)
            .then(value =>
                dispatch({
                    type: FETCH_GAMES_LOGID,
                    data: value,
                })
            )
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

export function fetchGames() {
    return dispatch => {
        dispatch(startRequest());
        getGames()
            .then(res =>
                dispatch({
                    type: FETCH_GAMES,
                    data: res,
                })
            )
            .then(() => dispatch(endRequest()))
            .catch(() => dispatch(endRequest()));
    };
}
