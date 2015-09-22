import { FETCH_GAMES, FETCH_VARS, FETCH_GAMES_LOGID } from './constants/ActionTypes';
import { getGameForLogId } from '../API/neo4j';
import { getGameModelForGame, getVariables, getGames } from '../API/wegas';

export function fetchGamesForLogId() {
    return (dispatch, getState) => {
        getGameForLogId(getState().logIds.current)
            .then(v => dispatch({
                    type: FETCH_GAMES_LOGID,
                    data: v
                }));
    };
}
export function fetchVariables(gameId) {
    return (dispatch) => {
        getGameModelForGame(gameId)
            .then(function(gmId) {
                return getVariables(gmId);
            }).then(data => dispatch({
                type: FETCH_VARS,
                data: data
            }));
    };
}
export function fetchGames() {
    return dispatch => {
        getGames().then(res => dispatch({
                type: FETCH_GAMES,
                data: res
            }));
    }
}
