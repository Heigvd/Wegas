import Axios from 'axios';

const BASE = '/rest/Editor/GameModel/';

export function getVariables(gmId) {
    return Axios.get(`${BASE}${gmId}/VariableDescriptor`).then(res => res.data);
}

export function getGameModelForGame(gameId) {
    return Axios.get(`${BASE}Game/${gameId}`)
        .then(d => d.data.gameModelId);
}
export function getGames() {
    return Axios.get(`${BASE}Game`)
        .then(res => res.data);
}
