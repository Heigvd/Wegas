import Axios from 'axios';

const PUBLIC = 'Public';
const EDITOR_EXTENDED = "Editor";
function basePath(view = 'Public') {
    return `/rest/${view}/GameModel/`;
}

export function getVariables(gmId) {
    return Axios.get(`${basePath(EDITOR_EXTENDED)}${gmId}/VariableDescriptor`)
        .then(res => res.data);
}

export function getGameModelForGame(gameId) {
    return Axios.get(`${basePath(PUBLIC)}Game/${gameId}`)
        .then(res => res.data.gameModelId);
}

export function getGames() {
    return Axios.get(`${basePath(PUBLIC)}Game`)
        .then(res => res.data);
}
