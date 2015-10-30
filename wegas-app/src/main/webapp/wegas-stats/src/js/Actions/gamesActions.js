import { FETCH_GAMES, FETCH_VARS, FETCH_GAMES_LOGID } from './constants/ActionTypes';
import { getGameForLogId } from '../API/neo4j';
import { getGameModelForGame, getVariables, getGames } from '../API/wegas';

export function fetchGamesForLogId() {
    return (dispatch, getState) => {
        getGameForLogId(getState().logIds.current)
            .then(value => dispatch({
                    type: FETCH_GAMES_LOGID,
                    data: value,
                })
        );
    };
}
export function fetchVariables(gameId) {
    return (dispatch) => {
        getGameModelForGame(gameId)
            .then(gmId => getVariables(gmId))
            .then(data => dispatch({
                    type: FETCH_VARS,
                    data: data,
                }));
    };
}
export function fetchGames() {
    return dispatch => {
        getGames()
            .then(res => dispatch({
                    type: FETCH_GAMES,
                    data: res,
                }));
    };
}
