import u from 'updeep';
import { FETCH_GAMES_LOGID, FETCH_GAMES } from '../Actions/constants/ActionTypes';

function games(state = u({
        cache: [],
        available: []
    }, null), action) {
    switch (action.type) {
        case FETCH_GAMES_LOGID:
            return u({
                available: action.data.map(v => Object.assign({
                        id: v
                    }, state.cache.get(v)))
            }, state);
        case FETCH_GAMES:
            const cache = new Map();
            action.data.forEach(obj => {
                cache.set(obj.id, {
                    name: obj.name,
                    gmName: obj.gameModelName
                });
            });
            return u({
                cache: cache
            }, state);
        default:
            return state;
    }
}

export default games;
