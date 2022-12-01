import jsonFetch from './wegasFetch';

const BASE = '/rest/Statistics';

const path = (p: string) => `${BASE}/${p}`

export async function getLogIds(): Promise<string[]> {
    return jsonFetch(path('LogId'));
}

/**
 * @param the logId
 * @returns list of gameId played with the given logId
 */
export async function getGameForLogId(logId: string): Promise<number[]> {
    return jsonFetch(path(`queryGames/${logId}`));
}

export interface QuestionData{
   /** internal name of the choice */
   choice: string;
   /** internal name of the result */
   result: string;
}

/**
 * @param logID the logId
 * @param name quantion name (scriptAlias)
 * @games list of object which contain id of games as value
 */
export async function getQuestionData(logID: string, name: string, ...games: {value: number}[]) : Promise<QuestionData[]> {
    if (logID && name && games[0]) {
        return jsonFetch(path(`LogId/${logID}/Question/${name}?gid=${games.map(g => g.value).join(',')}`));
    }
    throw 'getQuestion: Missing parameters';
}
