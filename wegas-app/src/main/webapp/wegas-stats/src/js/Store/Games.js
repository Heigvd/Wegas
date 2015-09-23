import u from 'updeep';
import { FETCH_GAMES_LOGID, FETCH_GAMES } from '../Actions/constants/ActionTypes';
let logIdGames = [];
function games(state = u({
        cache: new Map(),
        available: []
    }, null), action) {
    switch (action.type) {
        case FETCH_GAMES_LOGID:
            logIdGames = action.data;
            return u({
                available: logIdGames.map(v => Object.assign({
                        id: v
                    }, state.cache.get(v))),
            }, state);
        case FETCH_GAMES:
            const cache = new Map();
            action.data.forEach(obj => {
                cache.set(obj.id, {
                    name: obj.name,
                    gmName: obj.gameModelName
                });
            });
            return games(u({
                cache: cache
            }, state), {
                type: FETCH_GAMES_LOGID,
                data: logIdGames
            });
        default:
            return state;
    }
}

export default games;
