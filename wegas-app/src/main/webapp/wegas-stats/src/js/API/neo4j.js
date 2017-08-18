import jsonFetch from './wegasFetch';

const BASE = '/rest/Statistics/';

export function getLogIds() {
    return jsonFetch(BASE + 'LogId');
}

export function getGameForLogId(logId) {
    return jsonFetch(BASE + 'queryGames/' + logId);
}

export function getQuestionData(logID, name, ...games) {
    if (logID && name && games[0]) {
        return jsonFetch(
            `${BASE}LogId/${logID}/Question/${name}?gid=${games.join(',')}`
        );
    }
    return Promise.reject('getQuestion: Missing parameters');
}
