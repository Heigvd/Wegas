import Axios from 'axios';

const BASE = '/rest/GameModel/';
const EXPORT_BASE = '/rest/Export/GameModel';

export function getVariables(gmId) {
    return Axios.get(`${EXPORT_BASE}${gmId}/VariableDescriptor`).then(res => res.data);
}

export function getGameModelForGame(gameId) {
    return Axios.get(`${EXPORT_BASE}Game/${gameId}`)
        .then(d => d.data.gameModelId);
}
export function getGames() {
    return Axios.get(`${BASE}Game`)
        .then(res => res.data);
}
