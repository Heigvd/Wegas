import updeep from 'updeep';
import {
    FETCH_GAMES_LOGID,
    FETCH_GAMES,
} from '../Actions/constants/ActionTypes';
let logIdGames = [];
const defaultState = {
    cache: new Map(),
    available: [],
};
function games(state = updeep(defaultState)(null), action) {
    const cache = new Map();
    switch (action.type) {
        case FETCH_GAMES_LOGID:
            logIdGames = action.data;
            return updeep(
                {
                    available: logIdGames.map(gamesLID =>
                        Object.assign(
                            {
                                id: gamesLID,
                            },
                            state.cache.get(gamesLID)
                        )
                    ),
                },
                state
            );
        case FETCH_GAMES:
            action.data.forEach(obj => {
                cache.set(obj.gameId, {
                    name: obj.gameName,
                    gmName: obj.gameModelName,
                    creator: obj.creator,
                    playersCount: obj.players.length,
                });
            });
            return games(
                updeep(
                    {
                        cache,
                    },
                    state
                ),
                {
                    type: FETCH_GAMES_LOGID,
                    data: logIdGames,
                }
            );
        default:
            return state;
    }
}

export default games;
