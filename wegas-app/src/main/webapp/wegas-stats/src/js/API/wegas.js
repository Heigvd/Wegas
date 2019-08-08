import jsonFetch from './wegasFetch';

const PUBLIC = 'Public';
const EDITOR_EXTENDED = 'Export';

function basePath(view = PUBLIC) {
    return `/rest/${view}/GameModel/`;
}

export function getVariables(gmId) {
    return jsonFetch(`${basePath(EDITOR_EXTENDED)}${gmId}/VariableDescriptor`);
}

export function getGameModelForGame(gameId) {
    return jsonFetch(`${basePath()}Game/${gameId}`).then(
        data => data.gameModelId
    );
}

export function getGamesByIds(ids) {
    return jsonFetch(`/rest/Admin/GamesByIds`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ids)
    });
}
