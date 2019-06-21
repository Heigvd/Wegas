declare module 'match-sorter' {
  namespace matchSorter {
    export namespace rankings {
      export const CASE_SENSITIVE_EQUAL: 9;
      export const EQUAL: 8;
      export const STARTS_WITH: 7;
      export const WORD_STARTS_WITH: 6;
      export const STRING_CASE: 5;
      export const STRING_CASE_ACRONYM: 4;
      export const CONTAINS: 3;
      export const ACRONYM: 2;
      export const MATCHES: 1;
      /**
       * Don't filter results, only sort them by best match.
       */
      export const NO_MATCH: 0;
    }
    export namespace caseRankings {
      export const CAMEL: 0.8;
      export const PASCAL: 0.6;
      export const KEBAB: 0.4;
      export const SNAKE: 0.2;
      export const NO_CASE: 0;
    }
  }

  type Rankings = typeof matchSorter.rankings[keyof typeof matchSorter.rankings];
  type CaseRankings = typeof matchSorter.caseRankings[keyof typeof matchSorter.caseRankings];
  /**
   * Property or function returning the value
   */
  type Key<T> = keyof T | ((item: T) => string);
  interface KeyProp<T> {
    /**
     * Demote to this ranking.
     */
    maxRanking: Rankings;
    /**
     * Promote to this ranking in case of a MATCH.
     */
    minRanking: Rankings;
    key: Key<T>;
  }
  export interface Options<T> {
    /**
     * In case of an object, which keys to use for the rankings.
     *
     */
    keys?: (Key<T> | KeyProp<T>)[];
    /**
     * Can be used to specify the criteria used to filter the results.
     * defaults to MATCH
     */
    threshold?: Rankings;
    /**
     * By default, match-sorter will strip diacritics before doing any comparisons.
     * defaults to false.
     */
    keepDiacritics?: boolean;
  }
  /**
   * Rank a list given a criteria
   *
   * @param list List of elements to rank
   * @param search Search string
   * @param options Optional options
   */
  function matchSorter<T>(
    list: T[],
    search?: string | null,
    options?: Options<T>,
  ): T[];
  export default matchSorter;
}
